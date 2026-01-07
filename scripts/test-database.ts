import "dotenv/config"
import prisma from "../lib/prisma"

async function testDatabase() {
  console.log("🔍 Testing Prisma Postgres connection...\n")

  try {
    // Test 1: Check connection
    await prisma.$connect()
    console.log("✅ Connected to database!")

    // Test 2: Count challenges
    console.log("\n📝 Counting challenges...")
    const challengeCount = await prisma.challenge.count()
    console.log(`✅ Found ${challengeCount} challenge(s)`)

    // Test 3: Count deposits
    console.log("\n📋 Counting deposits...")
    const depositCount = await prisma.deposit.count()
    console.log(`✅ Found ${depositCount} deposit(s)`)

    console.log("\n🎉 All tests passed! Your database is working perfectly.\n")
  } catch (error) {
    console.error("❌ Error:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase()

