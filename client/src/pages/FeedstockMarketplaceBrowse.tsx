import React, { useState } from 'react';
import FeedstockCard, { Feedstock, FeedstockType, BankabilityStatus } from './FeedstockCard';

// --- Mock Data (Moved from design_plan.txt) ---

const MOCK_FEEDSTOCK_TYPES: FeedstockType[] = [
  { id: '1', name: 'Energy Crops', icon: 'Sprout' }, // Beema Bamboo, Miscanthus, etc.
  { id: '2', name: 'Biomass', icon: 'Leaf' },
  { id: '3', name: 'Algae', icon: 'Water' },
  { id: '4', name: 'Waste Oil', icon: 'Oil' },
  { id: '5', name: 'Sugars', icon: 'Sugar' },
  { id: '6', name: 'Starch', icon: 'Grain' },
  { id: '7', name: 'Lignocellulosic', icon: 'Wood' },
  { id: '8', name: 'Animal Fats', icon: 'Meat' },
  { id: '9', name: 'Municipal Waste', icon: 'Trash' },
  { id: '10', name: 'Agricultural Residues', icon: 'Farm' },
  { id: '11', name: 'Forest Residues', icon: 'Tree' },
  { id: '12', name: 'Industrial Byproducts', icon: 'Factory' },
  { id: '13', name: 'Other', icon: 'Question' },
];

const MOCK_FEEDSTOCKS: Feedstock[] = [
  {
    id: 'f0',
    name: 'Beema Bamboo',
    type: MOCK_FEEDSTOCK_TYPES[0], // Energy Crops
    location: 'Burdekin, QLD, Australia',
    bankability: { status: 'Verified', score: 95 },
    quantity: 60000,
    unit: 'Dry Tonnes/yr',
    supplierRating: 4.9,
    price: 45,
  },
  {
    id: 'f1',
    name: 'Sugarcane Bagasse',
    type: MOCK_FEEDSTOCK_TYPES[1], // Biomass
    location: 'Mackay, QLD, Australia',
    bankability: { status: 'Verified', score: 92 },
    quantity: 150000,
    unit: 'Tonnes',
    supplierRating: 4.8,
    price: 35,
  },
  {
    id: 'f2',
    name: 'Used Cooking Oil',
    type: MOCK_FEEDSTOCK_TYPES[3], // Waste Oil
    location: 'Brisbane, QLD, Australia',
    bankability: { status: 'Attention', score: 65 },
    quantity: 12000,
    unit: 'Litres',
    supplierRating: 3.1,
    price: 0.85,
  },
  {
    id: 'f3',
    name: 'Wheat Stubble',
    type: MOCK_FEEDSTOCK_TYPES[9], // Agricultural Residues
    location: 'Dubbo, NSW, Australia',
    bankability: { status: 'Pending', score: 78 },
    quantity: 80000,
    unit: 'Bales',
    supplierRating: 4.2,
    price: 30,
  },
  {
    id: 'f4',
    name: 'Forestry Residues',
    type: MOCK_FEEDSTOCK_TYPES[10], // Forest Residues
    location: 'Gippsland, VIC, Australia',
    bankability: { status: 'Verified', score: 82 },
    quantity: 25000,
    unit: 'Tonnes',
    supplierRating: 4.0,
    price: 40,
  },
  {
    id: 'f5',
    name: 'Tallow (Beef)',
    type: MOCK_FEEDSTOCK_TYPES[7], // Animal Fats
    location: 'Rockhampton, QLD, Australia',
    bankability: { status: 'Verified', score: 88 },
    quantity: 8000,
    unit: 'Tonnes',
    supplierRating: 4.5,
    price: 950,
  },
];

// --- Helper Components ---

const FilterButton: React.FC<{ type: FeedstockType, isSelected: boolean, onClick: () => void }> = ({ type, isSelected, onClick }) => {
  const baseClasses = 'text-[18px] font-medium rounded-lg transition-colors duration-200 min-h-[48px] px-4 py-2 border';
  const selectedClasses = 'bg-[#D4AF37] text-black border-[#D4AF37] font-semibold';
  const unselectedClasses = 'bg-white text-black border-gray-300 hover:bg-gray-100';

  return (
    <button
      className={`${baseClasses} ${isSelected ? selectedClasses : unselectedClasses} flex items-center space-x-2`}
      onClick={onClick}
    >
      {/* Placeholder for custom icon */}
      <span className="text-xl">{type?.icon?.charAt(0) || ""}</span>
      <span>{type.name}</span>
    </button>
  );
};

// --- Main Component ---

const FeedstockMarketplaceBrowse: React.FC = () => {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [locationSearch, setLocationSearch] = useState('');

  const handleTypeToggle = (typeId: string) => {
    setSelectedTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  const filteredFeedstocks = MOCK_FEEDSTOCKS.filter(f => {
    const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(f.type.id);
    const locationMatch = f.location.toLowerCase().includes(locationSearch.toLowerCase());
    return typeMatch && locationMatch;
  });

  return (
    <div className="min-h-screen bg-white p-10"> {/* Spacing: 40px scale (p-10) */}
      <header className="mb-10">
        <h1 className="text-4xl font-semibold text-black">Feedstock Marketplace</h1>
      </header>

      {/* Search & Filter Bar */}
      <div className="mb-10 p-6 bg-gray-50 rounded-xl border border-gray-200">
        <div className="mb-6">
          <label htmlFor="location-search" className="block text-black font-medium mb-2 text-[18px]">
            Location-based Search (Plain English Label)
          </label>
          <input
            id="location-search"
            type="text"
            placeholder="Search by city, country, or region..."
            value={locationSearch}
            onChange={(e) => setLocationSearch(e.target.value)}
            className="w-full text-[18px] text-black border border-black rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] min-h-[48px]" // Large input, gold focus ring, 48px min touch target
          />
        </div>

        <div className="mb-4">
          <h2 className="text-xl font-semibold text-black mb-4">Feedstock Type Filters (12 Types)</h2>
          <div className="flex flex-wrap gap-3"> {/* Spacing: 12px scale (gap-3) */}
            {MOCK_FEEDSTOCK_TYPES.map(type => (
              <FilterButton
                key={type.id}
                type={type}
                isSelected={selectedTypes.includes(type.id)}
                onClick={() => handleTypeToggle(type.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Feedstock Card Grid (Cards-first design) */}
      <main>
        <h2 className="text-2xl font-semibold text-black mb-6">
          {filteredFeedstocks.length} Feedstocks Available
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> {/* Spacing: 24px scale (gap-6) */}
          {filteredFeedstocks.map(feedstock => (
            <FeedstockCard key={feedstock.id} feedstock={feedstock} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default FeedstockMarketplaceBrowse;
