import { describe, expect, it } from "vitest";
import { ListId } from "@/features/army-list/lib/ListId";

const ID = "4f9e2111-d911-4a42-adb8-c4090971f82d";

describe("ListId.fromUserInput", () => {
  it.each([
    `https://wg.EasyArmy.com/BoltAction/ViewL/${ID}`,
    `https://wg.easyarmy.com/BoltAction/ViewL/${ID}?ps=1`,
    `http://wg.easyarmy.com/boltaction/viewl/${ID}/`,
    `wg.easyarmy.com/BoltAction/ViewL/${ID}`,
    `  ${ID.toUpperCase()}  `,
  ])("reads %s", (input) => {
    expect(ListId.fromUserInput(input)?.value).toBe(ID);
  });

  it.each([
    "",
    "not a list",
    `https://evil.example/BoltAction/ViewL/${ID}`,
    `https://wg.easyarmy.com.evil.example/BoltAction/ViewL/${ID}`,
    `https://wg.easyarmy.com/BoltAction/Other/${ID}`,
    "https://wg.easyarmy.com/BoltAction/ViewL/123",
    `ftp://wg.easyarmy.com/BoltAction/ViewL/${ID}`,
  ])("rejects %s", (input) => {
    expect(ListId.fromUserInput(input)).toBeNull();
  });
});

describe("ListId.fromId", () => {
  it("accepts only a GUID", () => {
    expect(ListId.fromId(ID)?.value).toBe(ID);
    expect(ListId.fromId(`${ID}/../x`)).toBeNull();
    expect(ListId.fromId("../etc")).toBeNull();
  });

  it("builds the EasyArmy URLs itself", () => {
    const id = ListId.fromId(ID.toUpperCase());

    expect(id?.shareUrl).toBe(`https://wg.easyarmy.com/BoltAction/ViewL/${ID}`);
    expect(id?.dataUrl).toBe(
      `https://wg.easyarmy.com/BoltAction/ViewL/${ID}?ps=1`
    );
  });
});
