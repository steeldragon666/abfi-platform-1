import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../drizzle/schema.js';
import { randomBytes } from 'crypto';

// Database connection
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { schema, mode: 'default' });

console.log('🌱 Starting seed data generation...\n');

// Helper function to generate random ID
const randomId = () => randomBytes(16).toString('hex');

// Helper function to calculate ABFI score
function calculateABFIScore(sustainability, carbon, quality, reliability) {
  return Math.round((sustainability + carbon + quality + reliability) / 4);
}

// Helper function to get rating grade
function getRatingGrade(score) {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'A-';
  if (score >= 80) return 'B+';
  if (score >= 75) return 'B';
  if (score >= 70) return 'B-';
  if (score >= 65) return 'C+';
  if (score >= 60) return 'C';
  return 'C-';
}

// 1. Create Users (Suppliers and Buyers)
console.log('Creating users...');
const supplierUsers = [];
const buyerUsers = [];

const supplierCompanies = [
  { name: 'Wilmar Sugar Australia', state: 'QLD', type: 'Sugar Mill' },
  { name: 'MSF Sugar', state: 'QLD', type: 'Sugar Mill' },
  { name: 'GrainCorp', state: 'NSW', type: 'Grain Producer' },
  { name: 'CBH Group', state: 'WA', type: 'Grain Producer' },
  { name: 'Australian Sustainable Hardwoods', state: 'VIC', type: 'Forestry' },
  { name: 'Tallow Australia', state: 'QLD', type: 'Tallow Processor' },
  { name: 'Biodiesel Producers Ltd', state: 'NSW', type: 'UCO Collector' },
  { name: 'Green Waste Solutions', state: 'VIC', type: 'Waste Management' },
  { name: 'Pacific Bioenergy', state: 'WA', type: 'Biomass Supplier' },
  { name: 'Queensland Biogas', state: 'QLD', type: 'Biogas Producer' },
  { name: 'Southern Cross Biofuels', state: 'SA', type: 'Biofuel Producer' },
  { name: 'Tasmanian Forestry Products', state: 'TAS', type: 'Forestry' },
  { name: 'Northern Territory Biomass', state: 'NT', type: 'Biomass Supplier' },
  { name: 'ACT Renewable Energy', state: 'ACT', type: 'Waste Management' },
  { name: 'Victorian Grain Growers', state: 'VIC', type: 'Grain Producer' }
];

for (const company of supplierCompanies) {
  const userId = randomId();
  const supplierId = randomId();
  
  await db.insert(schema.user).values({
    id: userId,
    openId: `supplier_${company.name.toLowerCase().replace(/\s+/g, '_')}`,
    name: `${company.name} Manager`,
    role: 'user',
    createdAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000) // Random date within last 6 months
  });

  await db.insert(schema.suppliers).values({
    id: supplierId,
    userId,
    companyName: company.name,
    abn: `${Math.floor(10000000000 + Math.random() * 90000000000)}`,
    contactPerson: `${company.name} Manager`,
    email: `contact@${company.name.toLowerCase().replace(/\s+/g, '')}.com.au`,
    phone: `+61 ${Math.floor(400000000 + Math.random() * 99999999)}`,
    address: `${Math.floor(1 + Math.random() * 999)} ${['Main', 'Industrial', 'Farm', 'Mill'][Math.floor(Math.random() * 4)]} Road`,
    city: company.state === 'QLD' ? ['Brisbane', 'Townsville', 'Mackay'][Math.floor(Math.random() * 3)] :
          company.state === 'NSW' ? ['Sydney', 'Newcastle', 'Wagga Wagga'][Math.floor(Math.random() * 3)] :
          company.state === 'VIC' ? ['Melbourne', 'Geelong', 'Ballarat'][Math.floor(Math.random() * 3)] :
          company.state === 'WA' ? ['Perth', 'Bunbury', 'Albany'][Math.floor(Math.random() * 3)] :
          company.state === 'SA' ? ['Adelaide', 'Mount Gambier'][Math.floor(Math.random() * 2)] :
          company.state === 'TAS' ? ['Hobart', 'Launceston'][Math.floor(Math.random() * 2)] :
          company.state === 'NT' ? 'Darwin' : 'Canberra',
    state: company.state,
    postcode: `${Math.floor(1000 + Math.random() * 8999)}`,
    country: 'Australia',
    businessType: company.type,
    yearsInOperation: Math.floor(5 + Math.random() * 45),
    certifications: ['ISCC', 'RSB', 'Bonsucro'][Math.floor(Math.random() * 3)],
    verificationStatus: Math.random() > 0.2 ? 'verified' : 'pending',
    verifiedAt: Math.random() > 0.2 ? new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000) : null
  });

  supplierUsers.push({ userId, supplierId, company });
}

const buyerCompanies = [
  { name: 'BP Australia', type: 'Refinery' },
  { name: 'Ampol', type: 'Fuel Distributor' },
  { name: 'Viva Energy', type: 'Refinery' },
  { name: 'Caltex Australia', type: 'Fuel Distributor' },
  { name: 'Neste Australia', type: 'Biofuel Producer' },
  { name: 'Renewable Energy Corp', type: 'Energy Company' },
  { name: 'Green Power Solutions', type: 'Energy Company' },
  { name: 'Australian Renewable Fuels', type: 'Biofuel Producer' },
  { name: 'Clean Energy Partners', type: 'Energy Company' },
  { name: 'Sustainable Fuels Australia', type: 'Biofuel Producer' }
];

for (const company of buyerCompanies) {
  const userId = randomId();
  const buyerId = randomId();
  
  await db.insert(schema.user).values({
    id: userId,
    openId: `buyer_${company.name.toLowerCase().replace(/\s+/g, '_')}`,
    name: `${company.name} Procurement`,
    role: 'user',
    createdAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000)
  });

  await db.insert(schema.buyers).values({
    id: buyerId,
    userId,
    companyName: company.name,
    abn: `${Math.floor(10000000000 + Math.random() * 90000000000)}`,
    contactPerson: `${company.name} Procurement`,
    email: `procurement@${company.name.toLowerCase().replace(/\s+/g, '')}.com.au`,
    phone: `+61 ${Math.floor(400000000 + Math.random() * 99999999)}`,
    address: `${Math.floor(1 + Math.random() * 999)} Corporate Drive`,
    city: ['Sydney', 'Melbourne', 'Brisbane', 'Perth'][Math.floor(Math.random() * 4)],
    state: ['NSW', 'VIC', 'QLD', 'WA'][Math.floor(Math.random() * 4)],
    postcode: `${Math.floor(1000 + Math.random() * 8999)}`,
    country: 'Australia',
    businessType: company.type,
    annualDemand: Math.floor(10000 + Math.random() * 490000),
    verificationStatus: 'verified',
    verifiedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000)
  });

  buyerUsers.push({ userId, buyerId, company });
}

console.log(`✅ Created ${supplierUsers.length} suppliers and ${buyerUsers.length} buyers\n`);

// 2. Create Feedstocks
console.log('Creating feedstocks...');

const feedstockTemplates = [
  { category: 'Sugar Cane Bagasse', description: 'High-quality bagasse from sugar milling operations', minPrice: 45, maxPrice: 85 },
  { category: 'Wheat Straw', description: 'Agricultural residue from wheat harvesting', minPrice: 35, maxPrice: 65 },
  { category: 'Canola Stubble', description: 'Post-harvest canola crop residue', minPrice: 30, maxPrice: 55 },
  { category: 'Wood Chips', description: 'Sustainably sourced hardwood chips', minPrice: 55, maxPrice: 95 },
  { category: 'Tallow (Category 1)', description: 'Premium grade animal tallow', minPrice: 800, maxPrice: 1200 },
  { category: 'Used Cooking Oil', description: 'Collected and filtered UCO', minPrice: 600, maxPrice: 950 },
  { category: 'Municipal Solid Waste', description: 'Sorted organic fraction', minPrice: 25, maxPrice: 45 },
  { category: 'Forestry Residue', description: 'Logging and sawmill residues', minPrice: 40, maxPrice: 70 },
  { category: 'Corn Stover', description: 'Corn stalks and leaves post-harvest', minPrice: 35, maxPrice: 60 },
  { category: 'Rice Husk', description: 'Rice milling by-product', minPrice: 20, maxPrice: 40 }
];

let feedstockCount = 0;

for (const supplier of supplierUsers.slice(0, 12)) { // First 12 suppliers
  const numFeedstocks = Math.floor(2 + Math.random() * 4); // 2-5 feedstocks per supplier
  
  for (let i = 0; i < numFeedstocks; i++) {
    const template = feedstockTemplates[Math.floor(Math.random() * feedstockTemplates.length)];
    const feedstockId = randomId();
    
    // Generate ABFI scores
    const sustainability = Math.floor(70 + Math.random() * 30); // 70-100
    const carbon = Math.floor(65 + Math.random() * 35); // 65-100
    const quality = Math.floor(70 + Math.random() * 30); // 70-100
    const reliability = Math.floor(75 + Math.random() * 25); // 75-100
    const abfiScore = calculateABFIScore(sustainability, carbon, quality, reliability);
    
    await db.insert(schema.feedstocks).values({
      id: feedstockId,
      supplierId: supplier.supplierId,
      name: `${template.category} - ${supplier.company.name}`,
      category: template.category,
      description: template.description,
      quantityAvailable: Math.floor(500 + Math.random() * 49500), // 500-50000 MT
      unit: 'MT',
      pricePerUnit: Math.floor(template.minPrice + Math.random() * (template.maxPrice - template.minPrice)),
      location: supplier.company.state,
      harvestSeason: ['Year-round', 'Summer', 'Winter', 'Spring', 'Autumn'][Math.floor(Math.random() * 5)],
      moistureContent: Math.floor(8 + Math.random() * 22), // 8-30%
      carbonIntensity: Math.floor(15 + Math.random() * 70), // 15-85 gCO2e/MJ
      certifications: [['ISCC'], ['RSB'], ['Bonsucro'], ['ISCC', 'RSB']][Math.floor(Math.random() * 4)],
      sustainabilityScore: sustainability,
      carbonScore: carbon,
      qualityScore: quality,
      reliabilityScore: reliability,
      abfiScore: abfiScore,
      abfiGrade: getRatingGrade(abfiScore),
      status: 'active',
      createdAt: new Date(Date.now() - Math.random() * 120 * 24 * 60 * 60 * 1000)
    });
    
    feedstockCount++;
  }
}

console.log(`✅ Created ${feedstockCount} feedstocks\n`);

// 3. Create Inquiries
console.log('Creating inquiries...');

const inquiryCount = Math.min(20, feedstockCount);
const allFeedstocks = await db.select().from(schema.feedstocks).limit(feedstockCount);

for (let i = 0; i < inquiryCount; i++) {
  const feedstock = allFeedstocks[Math.floor(Math.random() * allFeedstocks.length)];
  const buyer = buyerUsers[Math.floor(Math.random() * buyerUsers.length)];
  const inquiryId = randomId();
  
  const statuses = ['pending', 'responded', 'accepted', 'declined'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  
  await db.insert(schema.inquiries).values({
    id: inquiryId,
    feedstockId: feedstock.id,
    buyerId: buyer.buyerId,
    message: `We are interested in purchasing ${Math.floor(100 + Math.random() * 900)} MT of ${feedstock.category}. Please provide pricing and delivery terms.`,
    status: status,
    createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
    respondedAt: status !== 'pending' ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null
  });
}

console.log(`✅ Created ${inquiryCount} inquiries\n`);

// 4. Create Quality Tests
console.log('Creating quality tests...');

const qualityTestCount = Math.min(15, feedstockCount);

for (let i = 0; i < qualityTestCount; i++) {
  const feedstock = allFeedstocks[Math.floor(Math.random() * allFeedstocks.length)];
  const testId = randomId();
  
  await db.insert(schema.qualityTests).values({
    id: testId,
    feedstockId: feedstock.id,
    testType: ['Moisture Content', 'Ash Content', 'Calorific Value', 'Lipid Content'][Math.floor(Math.random() * 4)],
    testDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
    laboratory: ['ALS Environmental', 'SGS Australia', 'Intertek', 'Bureau Veritas'][Math.floor(Math.random() * 4)],
    result: `${(Math.random() * 100).toFixed(2)}`,
    unit: ['%', 'MJ/kg', 'g/kg'][Math.floor(Math.random() * 3)],
    passedStandard: Math.random() > 0.1,
    documentUrl: `https://storage.example.com/quality-tests/${testId}.pdf`
  });
}

console.log(`✅ Created ${qualityTestCount} quality tests\n`);

// 5. Create Saved Searches
console.log('Creating saved searches...');

for (let i = 0; i < 5; i++) {
  const buyer = buyerUsers[Math.floor(Math.random() * buyerUsers.length)];
  
  await db.insert(schema.savedSearches).values({
    id: randomId(),
    userId: buyer.userId,
    name: ['High Quality Bagasse', 'Low Carbon Tallow', 'NSW Grain Residues', 'Premium Wood Chips', 'Certified UCO'][i],
    filters: JSON.stringify({
      category: feedstockTemplates[i].category,
      minAbfiScore: 80,
      state: ['QLD', 'NSW', 'VIC', 'WA', 'SA'][i]
    })
  });
}

console.log(`✅ Created 5 saved searches\n`);

console.log('🎉 Seed data generation complete!\n');
console.log('Summary:');
console.log(`- ${supplierUsers.length} suppliers`);
console.log(`- ${buyerUsers.length} buyers`);
console.log(`- ${feedstockCount} feedstocks`);
console.log(`- ${inquiryCount} inquiries`);
console.log(`- ${qualityTestCount} quality tests`);
console.log(`- 5 saved searches`);

await connection.end();
