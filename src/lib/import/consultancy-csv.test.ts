import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { consultancySlug, parseCsv, readConsultancyCsv, slugify } from "./consultancy-csv";

const HEADER = "name,registration_number,address,city,district,phone,website,countries";

describe("parseCsv", () => {
  it("handles quotes, commas inside quotes and empty lines", () => {
    expect(parseCsv('a,b\r\n"x, y","say ""hi"""\n\n1,2\n')).toEqual([
      ["a", "b"],
      ["x, y", 'say "hi"'],
      ["1", "2"],
    ]);
  });
});

describe("slugify", () => {
  it("makes clean web addresses", () => {
    expect(slugify("Example Education Pvt. Ltd.")).toBe("example-education-pvt-ltd");
    expect(slugify("  A & B  Consultancy  ")).toBe("a-and-b-consultancy");
    expect(slugify("नेपाल")).toBe("");
  });

  it("leaves company endings and bracket notes out of consultancy addresses", () => {
    expect(consultancySlug("Example Education Pvt. Ltd.")).toBe("example-education");
    expect(consultancySlug("Sample Institute (P) Ltd.")).toBe("sample-institute");
    expect(consultancySlug("Demo Global P. Ltd ( Previously: Old Demo P. Ltd.)")).toBe("demo-global");
    expect(consultancySlug("Mock Abroad Private Limited")).toBe("mock-abroad");
    expect(consultancySlug("Ltd")).toBe("ltd");
  });
});

describe("readConsultancyCsv", () => {
  it("reads good rows", () => {
    const { consultancies, problems } = readConsultancyCsv(
      `${HEADER}\nExample Education Pvt. Ltd.,DEMO-1,"10 Demo Marg, Putalisadak",Kathmandu,Kathmandu,,example-education.example.com,au; jp`,
    );
    expect(problems).toEqual([]);
    expect(consultancies[0]).toMatchObject({
      line: 2,
      slug: "example-education",
      website: "https://example-education.example.com",
      countries: ["AU", "JP"],
      phone: null,
    });
    expect(consultancies[0].branches).toEqual([
      { line: 2, address: "10 Demo Marg, Putalisadak", city: "Kathmandu", district: "Kathmandu", phone: null, isHeadOffice: true },
    ]);
  });

  it("reports rows with problems and keeps the good ones", () => {
    const { consultancies, problems } = readConsultancyCsv(
      [HEADER, ",,,,,,,", "Good One,,,Pokhara,,,,", "Bad Country,,,,,,,XX", "Bad Site,,,,,,not a site,", "Good One,,,Pokhara,,,,", "X,,,,,,,"].join("\n"),
    );
    expect(consultancies.map((c) => c.name)).toEqual(["Good One"]);
    // Line 2 is empty and is skipped quietly. The line numbers still match the file.
    expect(problems.map((p) => p.line)).toEqual([4, 5, 6, 7]);
    expect(problems[2].message).toContain("line 3");
  });

  it("turns rows with the same name into branches of one consultancy", () => {
    const { consultancies, problems } = readConsultancyCsv(
      `${HEADER}\nSame Name,R-1,,Kathmandu,,,,AU\nSame Name,,,Pokhara,,,,JP\nSame Name,R-2,,Butwal,,,,`,
    );
    expect(consultancies).toHaveLength(1);
    expect(consultancies[0].countries).toEqual(["AU", "JP"]);
    expect(consultancies[0].branches.map((b) => [b.city, b.isHeadOffice])).toEqual([
      ["Kathmandu", true],
      ["Pokhara", false],
    ]);
    // A different registration number under the same name is a mistake to look at.
    expect(problems).toHaveLength(1);
    expect(problems[0].line).toBe(4);
  });

  it("says which columns are missing", () => {
    const { problems } = readConsultancyCsv("name,city\nA,B");
    expect(problems[0].message).toContain("registration_number");
  });

  it("the sample file has no problems", () => {
    const { consultancies, problems } = readConsultancyCsv(readFileSync("data/sample-consultancies.csv", "utf8"));
    expect(problems).toEqual([]);
    expect(consultancies).toHaveLength(5);
    expect(consultancies[1].branches).toHaveLength(2);
  });
});
