import { assessProtocolRisk, ProtocolInput } from "../agents/riskAgent";
import { resilientFetch } from "../agents/resilientFetch";

// Mock resilientFetch to simulate LLM responses
jest.mock("../agents/resilientFetch", () => ({
  resilientFetch: jest.fn(),
}));

const mockFetch = resilientFetch as jest.MockedFunction<typeof resilientFetch>;

describe("Risk Agent - LLM Provider Fallback and Regression Tests", () => {
  const dummyInput: ProtocolInput = {
    name: "TestProtocol",
    tvlUsd: 1000000,
    ageMonths: 12,
    audited: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockResponse = (body: any, ok: boolean = true) => {
    return Promise.resolve({
      ok,
      json: () => Promise.resolve(body),
    } as any);
  };

  it("handles malformed JSON from LLM by falling back to algorithmic scoring", async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse({
        candidates: [{ content: { parts: [{ text: "This is not valid JSON {score: broken}" }] } }],
      })
    );

    const result = await assessProtocolRisk(dummyInput);
    
    // Algorithmic fallback should give score based on inputs (tvl, age, audited)
    expect(result.protocol).toBe("TestProtocol");
    expect(result.reasoning).toContain("Algorithmic assessment");
    expect(result.score).toBeGreaterThan(0);
    expect(result.factors.smartContractRisk).toBe(80); // audited
  });

  it("handles empty choices from provider gracefully", async () => {
    // Simulate Gemini returning empty candidates
    mockFetch.mockResolvedValueOnce(
      createMockResponse({
        candidates: [],
      })
    );

    const result = await assessProtocolRisk(dummyInput);
    
    expect(result.reasoning).toContain("Algorithmic assessment");
    expect(result.score).toBeGreaterThan(0);
  });

  it("handles missing category fields by applying default medium category", async () => {
    // LLM returns valid JSON but misses 'category'
    mockFetch.mockResolvedValueOnce(
      createMockResponse({
        candidates: [{
          content: { parts: [{ text: JSON.stringify({
            score: 85,
            reasoning: "Seems good",
            factors: {
              smartContractRisk: 90,
              governanceRisk: 80,
              marketRisk: 70,
              sentimentScore: 60
            }
          })}]}
        }],
      })
    );

    const result = await assessProtocolRisk(dummyInput);
    
    expect(result.score).toBe(85);
    expect(result.category).toBe("medium"); // default category
  });

  it("returns deterministic fallback output on malformed model responses", async () => {
    // Throw error from fetch
    mockFetch.mockRejectedValueOnce(new Error("Network Error"));

    const result = await assessProtocolRisk(dummyInput);
    
    expect(result.reasoning).toContain("Algorithmic assessment based on TVL");
    expect(result.factors.smartContractRisk).toBe(80);
    expect(result.factors.governanceRisk).toBe(50);
  });
});
