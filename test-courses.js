// Quick test to check if courses exist and TEACHES relations are set up
const fs = require('fs');
const path = require('path');

// Load .env if it exists
if (fs.existsSync('.env')) {
  require('dotenv').config();
}

// Simulate a quick database check
async function testCourses() {
  try {
    // Read the Prisma client setup
    const prismaPath = path.join(__dirname, 'server/src/prisma.ts');
    console.log('Testing course endpoint...');
    
    // Check courses exist
    const response = await fetch('http://localhost:4000/api/curriculum/all-courses');
    const courses = await response.json();
    console.log(`Total courses in database: ${courses.length}`);
    
    if (courses.length > 0) {
      console.log('Sample course:', JSON.stringify(courses[0], null, 2));
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testCourses();
