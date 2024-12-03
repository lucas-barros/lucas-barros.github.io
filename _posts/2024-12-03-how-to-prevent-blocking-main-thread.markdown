---
layout: post
title: How to Avoid Blocking the JavaScript Main Thread
date: 2024-12-03
---

When working with JavaScript, one of the first concepts we encounter is that it operates on a **single-threaded event loop** model.
This is not necessarily a limitation of the language itself, but it's how most browsers and NodeJs environment implement it.

When synchronous tasks, like a large loop, dominate the thread, the event loop is unable to process any other pending tasks, like user input, network responses, or animations.
This might result in a "blocked" user interface where the browser might appear frozen or unresponsive.
This blog will focus on the browser environment, but the suggested techniques will work similarly in NodeJs environment.

We will use this simple function that adds all numbers from a value as an example.
Running this function for large values of `n` can freeze your application.
You can test this for yourself by running the code below.

### Initial solution
{% include editor.html.liquid id="blocking" language="javascript" height="150px" showButton=true content=
"function sum(n) {
  let sum = 0n;
  for (let num = 1n; num <= n; num++) {
    sum += num;
  }

  return sum;
}

sum(100000000n);"%}

As you can see, it makes the page unusable until the computation completes.
Fortunately, there are several techniques to handle such cases gracefully. Let's explore them!

---

## Using `setTimeout` to Break Tasks into Smaller Chunks

The `setTimeout` function can be used to break a large computation into smaller pieces, allowing the event loop to handle other tasks, like UI updates, between chunks. It will move the remaining work to a separate task that will be queued for subsequent execution.


### Refactored code with setTimeout
{% include editor.html.liquid id="timeout" language="javascript" height="480px" showButton=true content=
"function chunkSum(start, end) {
  let sum = 0n;
  for (let num = start; num < end; num++) {
    sum += num;
  }

  return sum;
}

function sum(n) {
  return new Promise((resolve) => {
    const chunkSize = 100000n;
    const last = n + 1n;
    let current = 1n;
    let sum = 0n;

    function computeChunk() {
      const nextChunk = current + chunkSize;
      const end = nextChunk < last ? nextChunk : last;
      sum += chunkSum(current, end);
      current = end;

      if (current <= n) {
        setTimeout(computeChunk, 0);
      } else {
        resolve(sum);
      }
    }

    computeChunk();
  });
}

sum(100000000n);"%}

While the function execution no longer freezes the page, it takes longer to complete. 
This happens because the remaining work, broken up with `setTimeout`, can be delayed further as other tasks in the event loop may take priority before the timeout callback is executed. 
Another down side is that your function complexity increases to allow for it to be done in chunks

---

## Leveraging Web Workers

Web Workers enable you to run JavaScript code in a separate thread, allowing the main thread to remain free for other operations. 
However, this does not mean JavaScript is no longer single-threaded. 
Each Web Worker operates in its own isolated thread, with no direct access to the main thread or the DOM. 
Communication between threads happens via message passing, which maintains JavaScript's single-threaded event loop model in each thread, avoiding shared state and ensuring thread safety.

Here's an example of using a Web Worker for our example function:

### Web Worker

Our web worker code is located at `/js/worker.js` with the code bellow.

{% include editor.html.liquid id="worker_thread" language="javascript" height="180px" content=
"function sum(n) {
  let sum = 0n;
  for (let num = 1n; num <= n; num++) {
    sum += num;
  }

  return sum;
}

onmessage = function (e) {
  postMessage(sum(Number(e.data)));
};"%}

### Main Thread

{% include editor.html.liquid id="main_thread" language="javascript" height="200px" showButton=true content=
"const worker = new Worker('/js/worker.js');

function run() {
  return new Promise((resolve) => {
    worker.postMessage(100000000);

    worker.onmessage = (event) => {
      resolve(event.data)
    };
  })
}
run()"%}

By offloading the computation to a worker, you ensure that the main thread remains responsive, regardless of how long the calculation takes.
If you're running JavaScript on the server, you can use Worker Threads API to execute CPU-intensive operations without blocking the main thread.
The upside for this approach is that the main function remains unchanged. The down side is the added complexity in the communication between main and worker thread.

---

## Scheduler.yield method

The `yield` method of the `Scheduler` interface allows a task to yield control to the main thread and resume execution later, with the continuation scheduled as a prioritized task. 

### Refactored code with yield
{% include editor.html.liquid id="yield" language="javascript" height="400px" showButton=true content=
"function chunkSum(start, end) {
  let sum = 0n;
  for (let num = start; num < end; num++) {
    sum += num;
  }

  return sum;
}

async function sum(n) {
  const chunkSize = 10000000n;
  const last = n + 1n;
  let current = 1n;
  let sum = 0n;

  while(current <= n) {
    const nextChunk = current + chunkSize;
    const end = nextChunk < last ? nextChunk : last;
    sum += chunkSum(current, end);
    current = end;
    await scheduler.yield();
  }

  return sum;
}

sum(100000000n);"%}

Unlike the `setTimeout` approach, `Scheduler.yield()` ensures that the remaining work is placed at the front of the queue rather than the back. This prioritization allows deferred tasks to resume promptly, minimizing the risk of delays caused by lower-priority tasks. As a result, execution time is optimized. The Scheduler API is relatively new, some browsers might not support it yet.


## Conclusion

Blocking the main thread is a common pitfall in JavaScript that can severely degrade user experience by freezing the browser and making your application unresponsive.

Fortunately, JavaScript provides several solutions to this issue, each tailored to specific scenarios:

- Task chunking with setTimeout: A browser-compatible method for breaking tasks into smaller, non-blocking parts.
- Web Workers: A straightforward way to offload heavy computations to a separate thread.
- Scheduler.yield: A modern API for optimizing task execution while maintaining UI responsiveness.

Understanding these techniques and when to apply them helps ensure your applications remain fast and responsive.
