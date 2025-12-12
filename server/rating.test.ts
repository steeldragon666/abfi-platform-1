import { describe, expect, it } from "vitest";
import {
  calculateAbfiScore,
  calculateCarbonIntensityScore,
  calculateSustainabilityScore,
  calculateQualityScore,
  calculateReliabilityScore,
  getCarbonIntensityGrade,
  getAbfiScoreGrade,
} from "./rating";
import type { Feedstock, Certificate, QualityTest, Transaction } from "../drizzle/schema";

describe("ABFI Rating System", () => {
  describe("Carbon Intensity Score", () => {
    it("should give A+ grade for CI < 10", () => {
      const score = calculateCarbonIntensityScore(5);
      expect(score).toBeGreaterThanOrEqual(95);
      expect(getCarbonIntensityGrade(5)).toBe("A+");
    });

    it("should give A grade for CI 10-20", () => {
      const score = calculateCarbonIntensityScore(15);
      expect(score).toBeGreaterThanOrEqual(85);
      expect(score).toBeLessThan(95);
      expect(getCarbonIntensityGrade(15)).toBe("A");
    });

    it("should give F grade for CI > 70", () => {
      const score = calculateCarbonIntensityScore(80);
      expect(score).toBeLessThan(35);
      expect(getCarbonIntensityGrade(80)).toBe("F");
    });

    it("should decrease score as CI increases", () => {
      const score1 = calculateCarbonIntensityScore(10);
      const score2 = calculateCarbonIntensityScore(30);
      const score3 = calculateCarbonIntensityScore(50);
      expect(score1).toBeGreaterThan(score2);
      expect(score2).toBeGreaterThan(score3);
    });
  });

  describe("Sustainability Score", () => {
    it("should give higher score for ABFI certified feedstock", () => {
      const feedstock: Partial<Feedstock> = {
        verificationLevel: "abfi_certified",
      };
      const certificates: Certificate[] = [];
      const score = calculateSustainabilityScore(feedstock as Feedstock, certificates);
      expect(score).toBeGreaterThanOrEqual(50);
    });

    it("should award points for premium certifications", () => {
      const feedstock: Partial<Feedstock> = {
        verificationLevel: "document_verified",
      };
      const certificates: Certificate[] = [
        {
          id: 1,
          feedstockId: 1,
          supplierId: 1,
          type: "ISCC_EU",
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Certificate,
      ];
      const score = calculateSustainabilityScore(feedstock as Feedstock, certificates);
      expect(score).toBeGreaterThan(40); // Should get 40 points for ISCC_EU
    });

    it("should give lower score for self-declared", () => {
      const feedstock: Partial<Feedstock> = {
        verificationLevel: "self_declared",
      };
      const score1 = calculateSustainabilityScore(feedstock as Feedstock, []);

      const feedstockCertified: Partial<Feedstock> = {
        verificationLevel: "abfi_certified",
      };
      const score2 = calculateSustainabilityScore(feedstockCertified as Feedstock, []);

      expect(score1).toBeLessThan(score2);
    });
  });

  describe("Quality Score", () => {
    it("should return baseline score when no quality tests exist", () => {
      const feedstock: Partial<Feedstock> = {
        verificationLevel: "abfi_certified",
        category: "oilseed",
      };
      const score = calculateQualityScore(feedstock as Feedstock, []);
      expect(score).toBe(80); // Baseline for ABFI certified
    });

    it("should calculate oilseed quality score correctly", () => {
      const feedstock: Partial<Feedstock> = {
        category: "oilseed",
      };
      const qualityTest: QualityTest = {
        id: 1,
        feedstockId: 1,
        testDate: new Date(),
        parameters: {
          oilContent: { value: 43, unit: "%", pass: true },
          freefattyAcid: { value: 1.5, unit: "%", pass: true },
          moisture: { value: 7, unit: "%", pass: true },
          impurities: { value: 1.5, unit: "%", pass: true },
          phosphorus: { value: 12, unit: "ppm", pass: true },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      } as QualityTest;

      const score = calculateQualityScore(feedstock as Feedstock, [qualityTest]);
      expect(score).toBeGreaterThan(90); // All parameters are excellent
    });

    it("should calculate UCO quality score correctly", () => {
      const feedstock: Partial<Feedstock> = {
        category: "UCO",
      };
      const qualityTest: QualityTest = {
        id: 1,
        feedstockId: 1,
        testDate: new Date(),
        parameters: {
          freefattyAcid: { value: 3, unit: "%", pass: true },
          moisture: { value: 0.3, unit: "%", pass: true },
          impurities: { value: 0.8, unit: "%", pass: true },
          iodineValue: { value: 100, unit: "g I2/100g", pass: true },
          miu: { value: 2, unit: "%", pass: true },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      } as QualityTest;

      const score = calculateQualityScore(feedstock as Feedstock, [qualityTest]);
      expect(score).toBeGreaterThan(85); // Good quality UCO
    });
  });

  describe("Reliability Score", () => {
    it("should return 50 for new suppliers with no transactions", () => {
      const score = calculateReliabilityScore([]);
      expect(score).toBe(50);
    });

    it("should give higher score for completed transactions", () => {
      const transactions: Transaction[] = [
        {
          id: 1,
          supplierId: 1,
          buyerId: 1,
          feedstockId: 1,
          inquiryId: 1,
          volumeTonnes: 100,
          pricePerTonne: 50000,
          totalValue: 5000000,
          status: "completed",
          buyerRating: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Transaction,
        {
          id: 2,
          supplierId: 1,
          buyerId: 1,
          feedstockId: 1,
          inquiryId: 2,
          volumeTonnes: 95,
          pricePerTonne: 50000,
          totalValue: 4750000,
          status: "completed",
          buyerRating: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Transaction,
      ];

      const score = calculateReliabilityScore(transactions);
      expect(score).toBeGreaterThan(50); // Should be better than new supplier
    });
  });

  describe("Composite ABFI Score", () => {
    it("should calculate weighted composite score correctly", () => {
      const feedstock: Partial<Feedstock> = {
        verificationLevel: "abfi_certified",
        category: "oilseed",
        carbonIntensityValue: 15,
      };

      const certificates: Certificate[] = [
        {
          id: 1,
          feedstockId: 1,
          supplierId: 1,
          type: "ISCC_EU",
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Certificate,
      ];

      const qualityTests: QualityTest[] = [
        {
          id: 1,
          feedstockId: 1,
          testDate: new Date(),
          parameters: {
            oilContent: { value: 43, unit: "%", pass: true },
            freefattyAcid: { value: 1.5, unit: "%", pass: true },
            moisture: { value: 7, unit: "%", pass: true },
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        } as QualityTest,
      ];

      const transactions: Transaction[] = [];

      const scores = calculateAbfiScore(
        feedstock as Feedstock,
        certificates,
        qualityTests,
        transactions
      );

      // Verify all scores are present
      expect(scores.abfiScore).toBeGreaterThan(0);
      expect(scores.sustainabilityScore).toBeGreaterThan(0);
      expect(scores.carbonIntensityScore).toBeGreaterThan(0);
      expect(scores.qualityScore).toBeGreaterThan(0);
      expect(scores.reliabilityScore).toBe(50); // New supplier

      // Verify composite is weighted average
      const expectedComposite =
        scores.sustainabilityScore * 0.3 +
        scores.carbonIntensityScore * 0.3 +
        scores.qualityScore * 0.25 +
        scores.reliabilityScore * 0.15;

      expect(scores.abfiScore).toBe(Math.round(expectedComposite));
    });

    it("should produce scores between 0 and 100", () => {
      const feedstock: Partial<Feedstock> = {
        verificationLevel: "self_declared",
        category: "waste",
        carbonIntensityValue: 80,
      };

      const scores = calculateAbfiScore(feedstock as Feedstock, [], [], []);

      expect(scores.abfiScore).toBeGreaterThanOrEqual(0);
      expect(scores.abfiScore).toBeLessThanOrEqual(100);
      expect(scores.sustainabilityScore).toBeGreaterThanOrEqual(0);
      expect(scores.sustainabilityScore).toBeLessThanOrEqual(100);
      expect(scores.carbonIntensityScore).toBeGreaterThanOrEqual(0);
      expect(scores.carbonIntensityScore).toBeLessThanOrEqual(100);
      expect(scores.qualityScore).toBeGreaterThanOrEqual(0);
      expect(scores.qualityScore).toBeLessThanOrEqual(100);
      expect(scores.reliabilityScore).toBeGreaterThanOrEqual(0);
      expect(scores.reliabilityScore).toBeLessThanOrEqual(100);
    });
  });

  describe("Score Grading", () => {
    it("should assign correct letter grades", () => {
      expect(getAbfiScoreGrade(95)).toBe("A+");
      expect(getAbfiScoreGrade(85)).toBe("A");
      expect(getAbfiScoreGrade(75)).toBe("B+");
      expect(getAbfiScoreGrade(65)).toBe("B");
      expect(getAbfiScoreGrade(55)).toBe("C+");
      expect(getAbfiScoreGrade(45)).toBe("C");
      expect(getAbfiScoreGrade(35)).toBe("D");
      expect(getAbfiScoreGrade(25)).toBe("F");
    });
  });
});
