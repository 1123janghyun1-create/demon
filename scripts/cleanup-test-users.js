import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vwtlhgqmndrshjcekhii.supabase.co';
const supabaseAnonKey = 'sb_publishable_It2EcGB26YzpEj6vbZQ5-g_GorZe1C5';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function cleanup() {
  console.log('🧹 Starting cleanup of test users and test data...\n');

  // Test identifiers
  const testEmails = [
    'verified_user100@gmail.com',
    'testuser999@gmail.com',
    'testuser123@gmail.com',
    'test_cred@example.com',
  ];

  const testUserIds = [
    'user-1795127325288-2hol',
    'user-1795093053747-rbjb',
    'user-1795092333773-86rt',
    'testuser123@gmail.com',
    'testuser999@gmail.com',
    'verified_user100@gmail.com',
  ];

  // 1. Delete from product_upvotes & update product vote counts
  console.log('1. Checking and removing test upvotes...');
  const { data: upvotes } = await supabase.from('product_upvotes').select('*');
  if (Array.isArray(upvotes)) {
    const testVotes = upvotes.filter((u) =>
      testUserIds.includes(u.user_id) || testEmails.includes(u.user_id)
    );

    console.log(`Found ${testVotes.length} test upvote(s) to remove.`);
    for (const vote of testVotes) {
      await supabase
        .from('product_upvotes')
        .delete()
        .eq('user_id', vote.user_id)
        .eq('product_id', vote.product_id);

      // Decrement product upvotes count
      const { data: prod } = await supabase
        .from('products')
        .select('id, upvotes')
        .eq('id', vote.product_id)
        .single();

      if (prod && typeof prod.upvotes === 'number') {
        const newCount = Math.max(0, prod.upvotes - 1);
        await supabase
          .from('products')
          .update({ upvotes: newCount })
          .eq('id', prod.id);
        console.log(`  - Decremented upvotes for product ${prod.id} to ${newCount}`);
      }
    }
  }

  // 2. Delete from builders
  console.log('\n2. Deleting test builders...');
  for (const email of testEmails) {
    const { data: delB } = await supabase
      .from('builders')
      .delete()
      .eq('email', email)
      .select();
    if (delB && delB.length > 0) {
      console.log(`  - Deleted builder by email: ${email}`);
    }
  }

  for (const uid of testUserIds) {
    const { data: delB } = await supabase
      .from('builders')
      .delete()
      .eq('id', uid)
      .select();
    if (delB && delB.length > 0) {
      console.log(`  - Deleted builder by id: ${uid}`);
    }
  }

  // Also delete any builder with name '검증유저' or '테스트메이커'
  const { data: namedB } = await supabase
    .from('builders')
    .delete()
    .in('name', ['검증유저', '테스트메이커'])
    .select();
  if (namedB && namedB.length > 0) {
    console.log(`  - Deleted builders with test names: ${namedB.length}`);
  }

  // 3. Delete from direct_messages (including SYSTEM_AUTH credentials)
  console.log('\n3. Deleting test direct_messages / credentials...');
  // Delete by known credential IDs
  const credIds = [
    'auth_cred_1795093480590',
    'auth_cred_1795093718919',
    'auth_cred_1795127325288_rily',
  ];
  for (const cid of credIds) {
    await supabase.from('direct_messages').delete().eq('id', cid);
  }

  // Delete all SYSTEM_AUTH messages for test receivers
  const { data: allDms } = await supabase.from('direct_messages').select('*');
  if (Array.isArray(allDms)) {
    const testDms = allDms.filter((dm) => {
      const rec = dm.receiver_id || '';
      const sen = dm.sender_id || '';
      const txt = dm.text || '';
      return (
        testEmails.includes(rec) ||
        testUserIds.includes(rec) ||
        testEmails.includes(sen) ||
        testUserIds.includes(sen) ||
        rec.includes('test_unit') ||
        rec.includes('test_cred') ||
        txt.includes('testuser') ||
        txt.includes('verified_user')
      );
    });

    for (const dm of testDms) {
      await supabase.from('direct_messages').delete().eq('id', dm.id);
      console.log(`  - Deleted test message/cred: ${dm.id} (${dm.receiver_id})`);
    }
  }

  // 4. Verify clean state
  console.log('\n4. Verifying final state:');
  const { data: finalBuilders } = await supabase.from('builders').select('id, name, email');
  console.log(`Total builders remaining: ${finalBuilders?.length}`);
  finalBuilders?.forEach((b) => console.log(`  - [${b.id}] ${b.name} (${b.email})`));

  const { data: finalDms } = await supabase
    .from('direct_messages')
    .select('id, sender_id, receiver_id')
    .eq('sender_id', 'SYSTEM_AUTH');
  console.log(`Remaining SYSTEM_AUTH credentials: ${finalDms?.length}`);

  console.log('\n✨ Cleanup completed successfully!');
}

cleanup().catch((err) => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
