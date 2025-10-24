// Verify Chat System Setup
// Run this to check if your chat system is properly deployed
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Environment variables missing!');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
  console.error('Current env:');
  console.error('VITE_SUPABASE_URL:', supabaseUrl || 'Not set');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyChatSystem() {
  console.log('🔍 Verifying Chat System Setup...\n');
  
  const results = {
    environment: { pass: false, issues: [] },
    database: { pass: false, issues: [] },
    edgeFunctions: { pass: false, issues: [] },
    openai: { pass: false, issues: [] }
  };

  // 1. Check Environment Variables
  console.log('1. 🔧 Checking Environment Variables...');
  try {
    if (supabaseUrl && supabaseAnonKey) {
      console.log('   ✅ Supabase URL and Anon Key configured');
      results.environment.pass = true;
    } else {
      console.log('   ❌ Missing Supabase environment variables');
      results.environment.issues.push('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
    }
    
    const openaiKey = process.env.VITE_OPENAI_API_KEY;
    if (openaiKey) {
      console.log('   ✅ OpenAI API key configured');
      results.openai.pass = true;
    } else {
      console.log('   ❌ Missing OpenAI API key');
      results.openai.issues.push('Missing VITE_OPENAI_API_KEY');
    }
    
    console.log(`   📍 Supabase URL: ${supabaseUrl}`);
    console.log(`   🔑 Anon Key: ${supabaseAnonKey.substring(0, 20)}...`);
    console.log(`   🤖 OpenAI Key: ${openaiKey ? openaiKey.substring(0, 20) + '...' : 'Not set'}`);
    
  } catch (error) {
    console.log('   ❌ Error checking environment:', error.message);
    results.environment.issues.push(error.message);
  }

  // 2. Check Database Tables
  console.log('\n2. 🗄️ Checking Database Tables...');
  const requiredTables = ['chat_sessions', 'chat_messages', 'chat_leads', 'chat_abuse_reports', 'chat_rate_limits', 'knowledge_base'];
  let tablesExist = 0;
  
  for (const table of requiredTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`   ❌ Table '${table}' - Error: ${error.message}`);
        results.database.issues.push(`Table '${table}' error: ${error.message}`);
      } else {
        console.log(`   ✅ Table '${table}' exists`);
        tablesExist++;
      }
    } catch (error) {
      console.log(`   ❌ Table '${table}' - Exception: ${error.message}`);
      results.database.issues.push(`Table '${table}' exception: ${error.message}`);
    }
  }
  
  if (tablesExist === requiredTables.length) {
    results.database.pass = true;
    console.log(`   ✅ All ${requiredTables.length} required tables exist`);
  } else {
    console.log(`   ❌ Only ${tablesExist}/${requiredTables.length} tables exist`);
  }

  // 3. Check Edge Functions
  console.log('\n3. ⚡ Checking Edge Functions...');
  const requiredFunctions = ['chat-bot', 'process-chat-lead', 'send-email'];
  let functionsWorking = 0;
  
  for (const functionName of requiredFunctions) {
    try {
      console.log(`   🔍 Testing '${functionName}' function...`);
      
      let testBody = {};
      if (functionName === 'chat-bot') {
        testBody = { message: 'test', sessionId: 'test-session' };
      } else if (functionName === 'process-chat-lead') {
        testBody = { sessionId: 'test-session' };
      } else if (functionName === 'send-email') {
        testBody = { to: 'test@example.com', subject: 'Test', message: 'Test' };
      }
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: testBody
      });
      
      if (error) {
        console.log(`   ❌ Function '${functionName}' - Error: ${error.message}`);
        results.edgeFunctions.issues.push(`Function '${functionName}' error: ${error.message}`);
      } else {
        console.log(`   ✅ Function '${functionName}' is deployed and responding`);
        functionsWorking++;
      }
    } catch (error) {
      console.log(`   ❌ Function '${functionName}' - Exception: ${error.message}`);
      results.edgeFunctions.issues.push(`Function '${functionName}' exception: ${error.message}`);
    }
  }
  
  if (functionsWorking === requiredFunctions.length) {
    results.edgeFunctions.pass = true;
    console.log(`   ✅ All ${requiredFunctions.length} edge functions are working`);
  } else {
    console.log(`   ❌ Only ${functionsWorking}/${requiredFunctions.length} functions are working`);
  }

  // 4. Test Knowledge Base
  console.log('\n4. 📚 Checking Knowledge Base...');
  try {
    const { data: kbData, error: kbError } = await supabase
      .from('knowledge_base')
      .select('*')
      .eq('is_active', true);
    
    if (kbError) {
      console.log(`   ❌ Knowledge base error: ${kbError.message}`);
      results.database.issues.push(`Knowledge base error: ${kbError.message}`);
    } else {
      console.log(`   ✅ Knowledge base has ${kbData.length} active entries`);
      if (kbData.length > 0) {
        console.log(`   📝 Sample entry: "${kbData[0].title}"`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Knowledge base exception: ${error.message}`);
    results.database.issues.push(`Knowledge base exception: ${error.message}`);
  }

  // 5. Summary
  console.log('\n📊 VERIFICATION SUMMARY:');
  console.log('========================');
  
  const allPassed = results.environment.pass && results.database.pass && results.edgeFunctions.pass && results.openai.pass;
  
  console.log(`Environment: ${results.environment.pass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Database: ${results.database.pass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Edge Functions: ${results.edgeFunctions.pass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`OpenAI: ${results.openai.pass ? '✅ PASS' : '❌ FAIL'}`);
  
  if (allPassed) {
    console.log('\n🎉 ALL SYSTEMS GO!');
    console.log('✅ Your chat system is properly set up and should create leads');
    console.log('🚀 Users can now chat with the bot and leads will be saved to your database');
  } else {
    console.log('\n⚠️  ISSUES FOUND:');
    console.log('The following issues need to be fixed for leads to be created:');
    
    [...results.environment.issues, ...results.database.issues, ...results.edgeFunctions.issues, ...results.openai.issues].forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
    
    console.log('\n📋 NEXT STEPS:');
    if (!results.edgeFunctions.pass) {
      console.log('• Deploy edge functions to your live Supabase');
      console.log('• Run: supabase functions deploy chat-bot');
      console.log('• Run: supabase functions deploy process-chat-lead');
    }
    if (!results.database.pass) {
      console.log('• Run database migrations to create missing tables');
      console.log('• Check your Supabase SQL Editor for any errors');
    }
    if (!results.openai.pass) {
      console.log('• Add VITE_OPENAI_API_KEY to your .env file');
      console.log('• Get an API key from https://platform.openai.com/api-keys');
    }
  }
  
  return allPassed;
}

// Run the verification
verifyChatSystem().catch(console.error); 