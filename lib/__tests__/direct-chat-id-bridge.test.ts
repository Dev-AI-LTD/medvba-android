/**
 * Schema-check contracts for chat_id → direct_chat_id bridge.
 * File/SQL shape tests (no live DB). Covers greenfield expectations + 026 branch logic.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const root = join(__dirname, '../..');

function read(rel: string): string {
  return readFileSync(join(root, rel), 'utf8');
}

/** Pure decision for existing-DB column bridge (mirrors 026 states). */
export function bridgeColumnAction(opts: {
  tableExists: boolean;
  hasChatId: boolean;
  hasDirectChatId: boolean;
}): 'rename' | 'noop_canonical' | 'fail_both' | 'noop_missing' {
  if (!opts.tableExists) return 'noop_missing';
  if (opts.hasChatId && opts.hasDirectChatId) return 'fail_both';
  if (opts.hasChatId && !opts.hasDirectChatId) return 'rename';
  if (opts.hasDirectChatId) return 'noop_canonical';
  return 'noop_missing';
}

describe('direct_chat_id bridge — new DB expectations', () => {
  const schema = read('supabase/schema.sql');
  const schemaFix = read('supabase/schema-fix.sql');
  const mig004 = read('supabase/migrations/004_rls_security_hardening.sql');
  const mig005 = read('supabase/migrations/005_kinde_jwt_rls.sql');
  const mig007 = read('supabase/migrations/007_fix_direct_chat_rls_recursion.sql');
  const mig014 = read('supabase/migrations/014_direct_chats_fk_profiles.sql');
  const hooks = read('lib/supabase-hooks.ts');

  it('schema.sql uses direct_chat_id on participants and messages', () => {
    expect(schema).toMatch(/direct_chat_participants[\s\S]*?direct_chat_id UUID/);
    expect(schema).toMatch(/direct_chat_messages[\s\S]*?direct_chat_id UUID/);
    expect(schema).toContain('UNIQUE(direct_chat_id, user_id)');
    expect(schema).toContain('idx_direct_chat_participants_direct_chat_id');
    expect(schema).toContain('idx_direct_chat_messages_direct_chat_id');
    expect(schema).not.toMatch(
      /CREATE TABLE IF NOT EXISTS public\.direct_chat_participants \([\s\S]*?\bchat_id UUID/,
    );
    expect(schema).not.toMatch(
      /CREATE TABLE IF NOT EXISTS public\.direct_chat_messages \([\s\S]*?\bchat_id UUID/,
    );
  });

  it('schema-fix.sql policies use direct_chat_id', () => {
    expect(schemaFix).toContain('WHERE direct_chat_id = id');
    expect(schemaFix).toContain(
      'WHERE direct_chat_id = direct_chat_messages.direct_chat_id',
    );
    expect(schemaFix).not.toContain(
      'WHERE chat_id = direct_chat_messages.chat_id',
    );
  });

  it('004 still references direct_chat_id (unchanged)', () => {
    expect(mig004).toContain('direct_chat_id');
    expect(mig004).not.toMatch(/dcp\.chat_id|WHERE chat_id =/);
  });

  it('companions 005/007/014 use direct_chat_id (no dcp.chat_id)', () => {
    expect(mig005).toContain('dcp.direct_chat_id');
    expect(mig005).not.toContain('dcp.chat_id');
    expect(mig007).toContain('dcp.direct_chat_id');
    expect(mig007).not.toContain('dcp.chat_id');
    expect(mig007).toContain(
      'medvba_is_direct_chat_participant(direct_chat_id, public.current_profile_id())',
    );
    expect(mig014).toContain('dm.direct_chat_id');
    expect(mig014).toContain('dcp.direct_chat_id');
    expect(mig014).not.toContain('dm.chat_id');
    expect(mig014).not.toContain('dcp.chat_id');
  });

  it('hooks use direct_chat_id for participants/messages realtime + CRUD', () => {
    expect(hooks).toContain("from('direct_chat_participants')");
    expect(hooks).toContain('direct_chat_id,');
    expect(hooks).toContain(".eq('direct_chat_id', chatId)");
    expect(hooks).toContain(".in('direct_chat_id', chatIds)");
    expect(hooks).toContain('filter: `direct_chat_id=eq.${chatId}`');
    expect(hooks).toContain('direct_chat_id: chatData.id');
    expect(hooks).toContain('direct_chat_id: chatId');
    expect(hooks).toContain('direct_chat_id: input.chatId');
    // activity_feed / user_reports keep chat_id
    expect(hooks).toContain("select('id, actor_id, type, payload, created_at, chat_id')");
  });
});

describe('direct_chat_id bridge — existing DB branch logic', () => {
  const mig026 = read('supabase/migrations/026_rename_chat_id_to_direct_chat_id.sql');

  it('026 encodes four idempotent states', () => {
    expect(mig026).toContain('both chat_id and direct_chat_id');
    expect(mig026).toContain('RENAME COLUMN chat_id TO direct_chat_id');
    expect(mig026).toContain('already has direct_chat_id — no-op');
    expect(mig026).toMatch(/neither chat_id nor direct_chat_id|missing — no-op/);
    expect(mig026).toContain('dcp.direct_chat_id = p_chat_id');
    expect(mig026).not.toContain('dcp.chat_id');
  });

  it('branch helper: rename when only chat_id', () => {
    expect(
      bridgeColumnAction({ tableExists: true, hasChatId: true, hasDirectChatId: false }),
    ).toBe('rename');
  });

  it('branch helper: no-op when only direct_chat_id', () => {
    expect(
      bridgeColumnAction({ tableExists: true, hasChatId: false, hasDirectChatId: true }),
    ).toBe('noop_canonical');
  });

  it('branch helper: fail when both columns', () => {
    expect(
      bridgeColumnAction({ tableExists: true, hasChatId: true, hasDirectChatId: true }),
    ).toBe('fail_both');
  });

  it('branch helper: no-op when table/columns missing', () => {
    expect(
      bridgeColumnAction({ tableExists: false, hasChatId: false, hasDirectChatId: false }),
    ).toBe('noop_missing');
    expect(
      bridgeColumnAction({ tableExists: true, hasChatId: false, hasDirectChatId: false }),
    ).toBe('noop_missing');
  });
});
