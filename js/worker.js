function sum(n) {
  let sum = 0n;
  for (let num = 1n; num <= n; num++) {
    sum += num;
  }

  return sum;
}

onmessage = function (e) {
  postMessage(sum(Number(e.data)));
};