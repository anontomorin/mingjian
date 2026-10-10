/**
 * 明鉴 · 确定性洗牌
 *
 * 用途：结论选项、行动选项、证据卡在界面上的呈现顺序需要打乱，
 * 否则玩家会学会「最后一个就是正确答案」，练习就失去了意义。
 *
 * 为什么不用 Math.random()：
 * - 刷新页面后顺序会变，用户会以为自己记错；
 * - 存档里记录的选项 id 与界面顺序脱节，复盘时无法对应；
 * - 无法写测试。
 * 因此这里用「案例 id 作为种子」的确定性洗牌：同一案例顺序固定、可复现、可测试。
 */

/** 字符串 -> 32 位整数种子（FNV-1a 变体） */
export function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** 由种子派生的线性同余伪随机数生成器，返回 [0,1) */
function makeRandom(seed: number): () => number {
  let state = seed || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/**
 * 确定性洗牌（Fisher-Yates）。相同 seed 必定得到相同结果，不修改原数组。
 */
export function seededShuffle<T>(items: readonly T[], seed: string | number): T[] {
  const arr = items.slice();
  if (arr.length <= 1) return arr;
  const random = makeRandom(typeof seed === "number" ? seed >>> 0 : hashSeed(seed));
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}
