export const getRandomTileId = (
  data: { id: number; chance: number }[]
): number => {
  const totalChance = data.reduce((acc, curr) => acc + curr.chance, 0);
  let randomValue = Math.random() * totalChance;

  for (const dat of data) {
    randomValue -= dat.chance;
    if (randomValue <= 0) {
      return dat.id;
    }
  }
  return data[0].id;
};

export const getRandomNumber = (first: number, last: number): number => {
  // Ensure first is not greater than last
  if (first > last) {
    [first, last] = [last, first];
  }

  // Generate random number between first and last (inclusive)
  return Math.floor(Math.random() * (last - first + 1)) + first;
};
