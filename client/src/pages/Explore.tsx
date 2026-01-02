import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Compass,
  Leaf,
  Factory,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Building2,
  Truck,
  Banknote,
  Users,
  Globe,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { H2, H3, Body } from "@/components/Typography";

// Profiler questions
const PROFILER_QUESTIONS = [
  {
    id: "role",
    question: "What best describes your role?",
    options: [
      { id: "grower", label: "Feedstock Producer", description: "I grow or collect biofuel feedstocks", icon: Leaf, path: "/grower" },
      { id: "developer", label: "Project Developer / Offtaker", description: "I need to secure feedstock supply", icon: Factory, path: "/developer" },
      { id: "finance", label: "Financier / Investor", description: "I evaluate and fund bioenergy projects", icon: Banknote, path: "/finance" },
      { id: "other", label: "Other / Not Sure", description: "I'm exploring the platform", icon: Compass, path: null },
    ],
  },
  {
    id: "scale",
    question: "What's the scale of your operation?",
    options: [
      { id: "small", label: "Small / Individual", description: "< 1,000 tonnes per year", icon: Users },
      { id: "medium", label: "Medium Enterprise", description: "1,000 - 10,000 tonnes per year", icon: Building2 },
      { id: "large", label: "Large Commercial", description: "> 10,000 tonnes per year", icon: Globe },
      { id: "exploring", label: "Still Planning", description: "Exploring options", icon: Compass },
    ],
  },
  {
    id: "interest",
    question: "What's your primary interest?",
    options: [
      { id: "sell", label: "Sell Feedstock", description: "I want to find buyers for my feedstock", icon: Truck },
      { id: "buy", label: "Buy Feedstock", description: "I need reliable feedstock supply", icon: Factory },
      { id: "invest", label: "Investment Intelligence", description: "I want market data and risk analysis", icon: TrendingUp },
      { id: "learn", label: "Learn & Explore", description: "I want to understand the market", icon: Compass },
    ],
  },
  {
    id: "timeline",
    question: "What's your timeline?",
    options: [
      { id: "immediate", label: "Ready Now", description: "I need to act in the next 30 days", icon: CheckCircle2 },
      { id: "soon", label: "Planning Ahead", description: "Within the next 6 months", icon: ArrowRight },
      { id: "future", label: "Future Planning", description: "12+ months out", icon: Globe },
      { id: "exploring", label: "Just Exploring", description: "No specific timeline", icon: Compass },
    ],
  },
];

// Path recommendations based on answers
function getRecommendedPath(answers: Record<string, string>): { path: string; title: string; description: string } {
  // Direct role selection
  if (answers.role === "grower") {
    return { path: "/grower/dashboard", title: "Grower Dashboard", description: "Register and certify your feedstock" };
  }
  if (answers.role === "developer") {
    return { path: "/developer/dashboard", title: "Developer Dashboard", description: "Find and secure feedstock supply" };
  }
  if (answers.role === "finance") {
    return { path: "/finance/dashboard", title: "Finance Dashboard", description: "Access market intelligence and risk tools" };
  }

  // Interest-based routing for "other" role
  if (answers.interest === "sell") {
    return { path: "/grower/dashboard", title: "Grower Dashboard", description: "Start by registering your feedstock" };
  }
  if (answers.interest === "buy") {
    return { path: "/developer/dashboard", title: "Developer Dashboard", description: "Browse verified suppliers" };
  }
  if (answers.interest === "invest") {
    return { path: "/finance/dashboard", title: "Finance Dashboard", description: "Access intelligence tools" };
  }

  // Default to finance for exploration (most comprehensive)
  return { path: "/finance/dashboard", title: "Finance Dashboard", description: "Explore our intelligence suite" };
}

export default function Explore() {
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const currentQuestion = PROFILER_QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / PROFILER_QUESTIONS.length) * 100;

  const handleSelect = (optionId: string) => {
    const newAnswers = { ...answers, [currentQuestion.id]: optionId };
    setAnswers(newAnswers);

    // Check for direct path on first question
    const selectedOption = currentQuestion.options.find(o => o.id === optionId);
    if (currentQuestion.id === "role" && selectedOption?.path) {
      // Direct navigation for clear role selection
      navigate(`${selectedOption.path}/dashboard`);
      return;
    }

    // Move to next question or show results
    if (currentStep < PROFILER_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowResults(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const recommendation = getRecommendedPath(answers);

  if (showResults) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="h-16 w-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-[#D4AF37]" />
            </div>
            <H2 className="text-2xl">Your Recommended Path</H2>
            <Body className="text-muted-foreground">Based on your responses, we recommend starting here</Body>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-lg border-2 border-emerald-200 bg-emerald-50/50">
              <H3 className="text-lg mb-1">{recommendation.title}</H3>
              <Body size="sm" className="text-gray-600">{recommendation.description}</Body>
            </div>

            <div className="space-y-3">
              <Link href={recommendation.path}>
                <Button className="w-full bg-[#D4AF37] hover:bg-emerald-700">
                  Go to {recommendation.title}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <div className="grid grid-cols-3 gap-2">
                <Link href="/grower/dashboard">
                  <Button variant="outline" size="sm" className="w-full">
                    <Leaf className="h-4 w-4 mr-1" />
                    Grower
                  </Button>
                </Link>
                <Link href="/developer/dashboard">
                  <Button variant="outline" size="sm" className="w-full">
                    <Factory className="h-4 w-4 mr-1" />
                    Developer
                  </Button>
                </Link>
                <Link href="/finance/dashboard">
                  <Button variant="outline" size="sm" className="w-full">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Finance
                  </Button>
                </Link>
              </div>
            </div>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setAnswers({});
                setCurrentStep(0);
                setShowResults(false);
              }}
            >
              Start Over
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Search bar for quick navigation */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search dashboards, features, or documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 search-input"
            />
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-end mb-4">
          <Badge variant="outline">
            Question {currentStep + 1} of {PROFILER_QUESTIONS.length}
          </Badge>
        </div>
        {/* Progress */}
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-gray-600 mt-2 text-center">
            {Math.round(progress)}% complete
          </p>
        </div>

        {/* Question */}
        <Card>
          <CardHeader className="text-center">
            <div className="h-12 w-12 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-4">
              <Compass className="h-6 w-6 text-[#D4AF37]" />
            </div>
            <H3 className="text-xl">{currentQuestion.question}</H3>
            <Body className="text-muted-foreground">Select the option that best fits your situation</Body>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentQuestion.options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id)}
                className={cn(
                  "w-full p-4 rounded-lg border-2 text-left transition-all",
                  "hover:border-primary/50 hover:bg-primary/5",
                  answers[currentQuestion.id] === option.id && "border-primary bg-primary/5"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <option.icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">{option.label}</p>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                </div>
              </button>
            ))}

            {currentStep > 0 && (
              <Button variant="ghost" onClick={handleBack} className="w-full mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Skip option */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600 mb-2">Already know where you want to go?</p>
          <div className="flex justify-center gap-2">
            <Link href="/grower/dashboard">
              <Button variant="outline" size="sm">Grower</Button>
            </Link>
            <Link href="/developer/dashboard">
              <Button variant="outline" size="sm">Developer</Button>
            </Link>
            <Link href="/finance/dashboard">
              <Button variant="outline" size="sm">Finance</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
