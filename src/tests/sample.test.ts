const sum = (...a: number[]) => a.reduce((acc, val) => acc + val, 0);

test("Test Sum gives 0", async () => {
  expect(sum()).toBe(0);
});

test("Sum Two Numbers", async () => {
  expect(sum(1, 2)).toBe(3);
}, 1000 /* optional timeout */);
