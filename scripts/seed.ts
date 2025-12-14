/**
 * Comprehensive Seed Data Script
 * Populates the ABFI platform with realistic Australian bioenergy data
 */

import { getDb } from '../server/db';
import { sql } from 'drizzle-orm';
import { 
  users, suppliers, buyers, feedstocks, certificates, qualityTests, 
  inquiries, properties, productionHistory, carbonPractices, 
  existingContracts, marketplaceListings, projects, supplyAgreements,
  growerQualifications, bankabilityAssessments
} from '../drizzle/schema';

async function seed() {
  console.log('🌱 Starting seed data generation...');
  
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  // Clear existing data (in reverse dependency order)
  console.log('🗑️  Clearing existing data...');
  await db.delete(bankabilityAssessments);
  await db.delete(growerQualifications);
  await db.delete(supplyAgreements);
  await db.delete(projects);
  await db.delete(marketplaceListings);
  await db.delete(existingContracts);
  await db.delete(carbonPractices);
  await db.delete(productionHistory);
  await db.delete(properties);
  await db.delete(inquiries);
  await db.delete(qualityTests);
  await db.delete(certificates);
  await db.delete(feedstocks);
  await db.delete(buyers);
  await db.delete(suppliers);
  await db.delete(users).where(sql`role != 'admin'`); // Keep admin users

  // 1. Create Supplier Users & Profiles
  console.log('👥 Creating suppliers...');
  
  const supplierData = [
    {
      email: 'contact@canefarmers.com.au',
      name: 'Queensland Cane Farmers Co-op',
      role: 'supplier',
      abn: '12345678901',
      companyName: 'Queensland Cane Farmers Co-op',
      location: 'Mackay, QLD',
      feedstockTypes: ['sugarcane_bagasse'],
      verificationStatus: 'verified',
      rating: 4.8
    },
    {
      email: 'info@graingrowers.com.au',
      name: 'NSW Grain Growers Association',
      role: 'supplier',
      abn: '23456789012',
      companyName: 'NSW Grain Growers Association',
      location: 'Wagga Wagga, NSW',
      feedstockTypes: ['wheat_straw', 'barley_straw'],
      verificationStatus: 'verified',
      rating: 4.6
    },
    {
      email: 'sales@forestryresidues.com.au',
      name: 'Victorian Forestry Residues Pty Ltd',
      role: 'supplier',
      abn: '34567890123',
      companyName: 'Victorian Forestry Residues Pty Ltd',
      location: 'Gippsland, VIC',
      feedstockTypes: ['wood_chips', 'sawdust'],
      verificationStatus: 'verified',
      rating: 4.7
    },
    {
      email: 'contact@biowastemanagement.com.au',
      name: 'SA Biowaste Management',
      role: 'supplier',
      abn: '45678901234',
      companyName: 'SA Biowaste Management',
      location: 'Adelaide, SA',
      feedstockTypes: ['food_waste', 'green_waste'],
      verificationStatus: 'verified',
      rating: 4.5
    },
    {
      email: 'info@bambooaustralia.com.au',
      name: 'Bamboo Australia Plantations',
      role: 'supplier',
      abn: '56789012345',
      companyName: 'Bamboo Australia Plantations',
      location: 'Cairns, QLD',
      feedstockTypes: ['bamboo'],
      verificationStatus: 'verified',
      rating: 4.9
    }
  ];

  const supplierIds: number[] = [];
  
  for (const supplier of supplierData) {
    await db.insert(users).values({
      email: supplier.email,
      name: supplier.name,
      role: supplier.role as 'supplier',
      openId: `seed_${supplier.email}`,
    });

    // Get the user ID
    const [user] = await db.select().from(users).where(sql`${users.email} = ${supplier.email}`);

    await db.insert(suppliers).values({
      userId: user.id,
      abn: supplier.abn,
      companyName: supplier.companyName,
      contactEmail: supplier.email,
      verificationStatus: supplier.verificationStatus as 'verified',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Get the supplier ID
    const [supplierProfile] = await db.select().from(suppliers).where(sql`${suppliers.userId} = ${user.id}`);
    supplierIds.push(supplierProfile.id);
    console.log(`  ✓ Created supplier: ${supplier.companyName}`);
  }

  // 2. Create Buyer Users & Profiles
  console.log('🏭 Creating buyers...');
  
  const buyerData = [
    {
      email: 'procurement@biofuelrefinery.com.au',
      name: 'Australian Biofuel Refinery',
      role: 'buyer',
      abn: '98765432101',
      companyName: 'Australian Biofuel Refinery Pty Ltd',
      location: 'Brisbane, QLD',
      facilityType: 'Biofuel Refinery',
      annualCapacity: 150000
    },
    {
      email: 'supply@greenenergyplant.com.au',
      name: 'Green Energy Power Plant',
      role: 'buyer',
      abn: '87654321012',
      companyName: 'Green Energy Power Plant Ltd',
      location: 'Newcastle, NSW',
      facilityType: 'Biomass Power Plant',
      annualCapacity: 200000
    },
    {
      email: 'sourcing@biogasfacility.com.au',
      name: 'Victoria Biogas Facility',
      role: 'buyer',
      abn: '76543210123',
      companyName: 'Victoria Biogas Facility Pty Ltd',
      location: 'Melbourne, VIC',
      facilityType: 'Biogas Plant',
      annualCapacity: 80000
    }
  ];

  const buyerIds: number[] = [];

  for (const buyer of buyerData) {
    await db.insert(users).values({
      email: buyer.email,
      name: buyer.name,
      role: buyer.role as 'buyer',
      openId: `seed_${buyer.email}`,
    });

    // Get the user ID
    const [user] = await db.select().from(users).where(sql`${users.email} = ${buyer.email}`);

    await db.insert(buyers).values({
      userId: user.id,
      abn: buyer.abn,
      companyName: buyer.companyName,
      contactEmail: buyer.email,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Get the buyer ID
    const [buyerProfile] = await db.select().from(buyers).where(sql`${buyers.userId} = ${user.id}`);
    buyerIds.push(buyerProfile.id);
    console.log(`  ✓ Created buyer: ${buyer.companyName}`);
  }

  // 3. Create Feedstock Listings
  console.log('🌾 Creating feedstock listings...');
  
  const feedstockData = [
    {
      supplierId: supplierIds[0],
      category: 'agricultural',
      type: 'sugarcane_bagasse',
      availableQuantity: 50000,
      unit: 'tonnes',
      location: 'Mackay, QLD',
      sustainabilityScore: 85,
      carbonIntensity: 12.5,
      qualityScore: 90,
      reliabilityScore: 88,
      status: 'active'
    },
    {
      supplierId: supplierIds[1],
      category: 'agricultural',
      type: 'wheat_straw',
      availableQuantity: 30000,
      unit: 'tonnes',
      location: 'Wagga Wagga, NSW',
      sustainabilityScore: 80,
      carbonIntensity: 15.2,
      qualityScore: 85,
      reliabilityScore: 82,
      status: 'active'
    },
    {
      supplierId: supplierIds[2],
      category: 'forestry',
      type: 'wood_chips',
      availableQuantity: 75000,
      unit: 'tonnes',
      location: 'Gippsland, VIC',
      sustainabilityScore: 78,
      carbonIntensity: 18.3,
      qualityScore: 88,
      reliabilityScore: 90,
      status: 'active'
    },
    {
      supplierId: supplierIds[3],
      category: 'waste',
      type: 'food_waste',
      availableQuantity: 20000,
      unit: 'tonnes',
      location: 'Adelaide, SA',
      sustainabilityScore: 92,
      carbonIntensity: 8.7,
      qualityScore: 75,
      reliabilityScore: 80,
      status: 'active'
    },
    {
      supplierId: supplierIds[4],
      category: 'energy_crops',
      type: 'bamboo',
      availableQuantity: 15000,
      unit: 'tonnes',
      location: 'Cairns, QLD',
      sustainabilityScore: 95,
      carbonIntensity: 6.2,
      qualityScore: 92,
      reliabilityScore: 85,
      status: 'active'
    }
  ];

  const feedstockIds: number[] = [];

  for (const feedstock of feedstockData) {
    await db.insert(feedstocks).values({
      ...feedstock,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Get the feedstock ID
    const [listing] = await db.select().from(feedstocks)
      .where(sql`${feedstocks.supplierId} = ${feedstock.supplierId} AND ${feedstocks.type} = ${feedstock.type}`);
    feedstockIds.push(listing.id);
    console.log(`  ✓ Created feedstock: ${feedstock.type} (${feedstock.availableQuantity} ${feedstock.unit})`);
  }

  // 4. Create Sample Inquiries
  console.log('📧 Creating inquiries...');
  
  for (let i = 0; i < 5; i++) {
    await db.insert(inquiries).values({
      feedstockId: feedstockIds[i],
      buyerId: buyerIds[i % buyerIds.length],
      message: `Interested in purchasing ${feedstockData[i].type}. Please provide pricing and delivery terms.`,
      status: i % 3 === 0 ? 'pending' : i % 3 === 1 ? 'responded' : 'closed',
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
    });
  }
  
  console.log(`  ✓ Created 5 sample inquiries`);

  // 5. Create Bioenergy Projects
  console.log('🏗️  Creating bioenergy projects...');
  
  const projectData = [
    {
      name: 'Brisbane SAF Production Facility',
      location: 'Brisbane, QLD',
      feedstockType: 'sugarcane_bagasse',
      annualFeedstockVolume: 100000,
      status: 'operational',
      tier1Target: 80,
      tier2Target: 15
    },
    {
      name: 'Newcastle Biomass Power Plant',
      location: 'Newcastle, NSW',
      feedstockType: 'wheat_straw',
      annualFeedstockVolume: 75000,
      status: 'construction',
      tier1Target: 85,
      tier2Target: 10
    }
  ];

  const projectIds: number[] = [];

  for (const project of projectData) {
    await db.insert(projects).values({
      ...project,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Get the project ID
    const [proj] = await db.select().from(projects).where(sql`${projects.name} = ${project.name}`);
    projectIds.push(proj.id);
    console.log(`  ✓ Created project: ${project.name}`);
  }

  console.log('✅ Seed data generation complete!');
  console.log(`
📊 Summary:
  - ${supplierIds.length} suppliers created
  - ${buyerIds.length} buyers created
  - ${feedstockIds.length} feedstock listings created
  - 5 inquiries created
  - ${projectIds.length} bioenergy projects created
  `);
}

// Run seed script
seed()
  .then(() => {
    console.log('🎉 Seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
