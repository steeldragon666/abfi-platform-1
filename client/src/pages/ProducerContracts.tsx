import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Leaf,
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  FileText,
} from "lucide-react";
import { Link } from "wouter";

interface Contract {
  id: string;
  buyerName: string;
  volumeTonnes: string;
  startDate: string;
  endDate: string;
  deliveryFrequency: string;
  priceAUD: string;
}

export default function ProducerContracts() {
  const [, setLocation] = useLocation();
  const [hasContracts, setHasContracts] = useState<boolean | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);

  const addContract = () => {
    setContracts([
      ...contracts,
      {
        id: Date.now().toString(),
        buyerName: "",
        volumeTonnes: "",
        startDate: "",
        endDate: "",
        deliveryFrequency: "",
        priceAUD: "",
      },
    ]);
  };

  const removeContract = (id: string) => {
    setContracts(contracts.filter(c => c.id !== id));
  };

  const updateContract = (id: string, field: keyof Contract, value: string) => {
    setContracts(
      contracts.map(c => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const calculateTotalCommitted = () => {
    return contracts.reduce(
      (sum, c) => sum + (parseFloat(c.volumeTonnes) || 0),
      0
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(
      "producerRegistration",
      JSON.stringify({
        step: 6,
        data: { hasContracts, contracts },
      })
    );
    setLocation("/producer-registration/marketplace-listing");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between">
          <Link href="/">
            <a className="flex items-center gap-2 text-[#0F3A5C] hover:opacity-80">
              <Leaf className="h-6 w-6" />
              <span className="text-xl font-semibold">ABFI</span>
            </a>
          </Link>
          <div className="text-sm text-gray-600">
            Step 5 of 7: Existing Contracts
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="container mx-auto py-4">
          <Progress value={70} className="h-2" />
          <p className="mt-2 text-sm text-gray-600">
            70% Complete • Estimated 4 minutes remaining
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-12">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-[#0F3A5C]">
                Existing Contracts
              </CardTitle>
              <CardDescription>
                Tell buyers about your current commitments. This helps them
                understand your available supply.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Initial Question */}
                {hasContracts === null && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[#0F3A5C]">
                      Do you have existing supply contracts?
                    </h3>
                    <p className="text-sm text-gray-600">
                      These are contracts you've already signed with buyers for
                      future feedstock delivery.
                    </p>
                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setHasContracts(true);
                          addContract();
                        }}
                      >
                        Yes, I have contracts
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setHasContracts(false)}
                      >
                        No, all supply is available
                      </Button>
                    </div>
                  </div>
                )}

                {/* No Contracts Path */}
                {hasContracts === false && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
                    <FileText className="mx-auto mb-3 h-12 w-12 text-green-600" />
                    <h3 className="mb-2 text-lg font-semibold text-green-900">
                      Great! Your full supply is available
                    </h3>
                    <p className="text-sm text-green-700">
                      Buyers will see that all your feedstock is available for
                      new contracts.
                    </p>
                  </div>
                )}

                {/* Contracts Entry */}
                {hasContracts === true && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-[#0F3A5C]">
                        Contract Details
                      </h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addContract}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Contract
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {contracts.map((contract, index) => (
                        <div
                          key={contract.id}
                          className="rounded-lg border border-gray-200 p-4"
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <span className="font-semibold text-[#0F3A5C]">
                              Contract {index + 1}
                            </span>
                            {contracts.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeContract(contract.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Buyer Name *</Label>
                              <Input
                                placeholder="e.g., ABC Biofuels Pty Ltd"
                                value={contract.buyerName}
                                onChange={e =>
                                  updateContract(
                                    contract.id,
                                    "buyerName",
                                    e.target.value
                                  )
                                }
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Annual Volume (tonnes) *</Label>
                              <Input
                                type="number"
                                placeholder="e.g., 5000"
                                value={contract.volumeTonnes}
                                onChange={e =>
                                  updateContract(
                                    contract.id,
                                    "volumeTonnes",
                                    e.target.value
                                  )
                                }
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Contract Start Date *</Label>
                              <Input
                                type="date"
                                value={contract.startDate}
                                onChange={e =>
                                  updateContract(
                                    contract.id,
                                    "startDate",
                                    e.target.value
                                  )
                                }
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Contract End Date *</Label>
                              <Input
                                type="date"
                                value={contract.endDate}
                                onChange={e =>
                                  updateContract(
                                    contract.id,
                                    "endDate",
                                    e.target.value
                                  )
                                }
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Delivery Frequency *</Label>
                              <Select
                                value={contract.deliveryFrequency}
                                onValueChange={value =>
                                  updateContract(
                                    contract.id,
                                    "deliveryFrequency",
                                    value
                                  )
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select frequency" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="weekly">Weekly</SelectItem>
                                  <SelectItem value="fortnightly">
                                    Fortnightly
                                  </SelectItem>
                                  <SelectItem value="monthly">
                                    Monthly
                                  </SelectItem>
                                  <SelectItem value="quarterly">
                                    Quarterly
                                  </SelectItem>
                                  <SelectItem value="seasonal">
                                    Seasonal
                                  </SelectItem>
                                  <SelectItem value="on_demand">
                                    On Demand
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Price (AUD/tonne) - Optional</Label>
                              <Input
                                type="number"
                                placeholder="e.g., 85"
                                value={contract.priceAUD}
                                onChange={e =>
                                  updateContract(
                                    contract.id,
                                    "priceAUD",
                                    e.target.value
                                  )
                                }
                              />
                              <p className="text-xs text-gray-600">
                                Kept confidential
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Summary */}
                    {contracts.length > 0 && (
                      <div className="rounded-lg border border-[#F4C430]/30 bg-[#F4C430]/5 p-4">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#0F3A5C]">
                            Total Committed Volume:
                          </span>
                          <span className="text-lg font-bold text-[#0F3A5C]">
                            {calculateTotalCommitted().toLocaleString()}{" "}
                            tonnes/year
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                      <p className="text-sm text-blue-900">
                        <strong>Privacy Note:</strong> Contract details are kept
                        confidential. Only the total committed volume is shown
                        to potential buyers to help them understand your
                        available supply.
                      </p>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                {hasContracts !== null && (
                  <div className="flex items-center justify-between pt-6">
                    <Link href="/producer-registration/carbon-calculator">
                      <Button type="button" variant="ghost" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                      </Button>
                    </Link>

                    <Button
                      type="submit"
                      className="gap-2 bg-[#F4C430] text-[#0F3A5C] hover:bg-[#F4C430]/90"
                    >
                      Continue to Marketplace Listing
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
