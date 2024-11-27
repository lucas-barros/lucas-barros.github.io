---
layout: post
title: Understanding Recursion in JavaScript
date: 2024-11-27
---

Recursion is a programming technique where a function solves smaller instances of a problem by calling itself.
In JavaScript, recursion has a limitation. Most JavaScript engines do not support tail call optimization (TCO).
This makes deep recursion unsafe because it can lead to stack overflow errors.
This issue can be mitigated with techniques like **trampolining** or by using alternative languages that support TCO, such as **ClojureScript**.
This post explores these options, with examples.

## Why Recursion Can Be Unsafe in JavaScript

### Lack of Tail Call Optimization (TCO)

TCO allows a language runtime to reuse the current stack frame when a recursive call is made in the last operation of the function or tail position.
Without TCO, JavaScript engines create a new stack frame for each recursive call, which can lead to a stack overflow error when the recursion depth exceeds the call stack limit.

For reference, the default stack size for Nodejs v20 is 984 kBytes. For simple recursive functions, like a function with few or no arguments or local variables,
you can expect the stack to handle around 10_000 recursive calls on most systems before encountering a `RangeError: Maximum call stack size exceeded`.

Here's an example of a tail-recursive function in JavaScript:

{% include editor.html.liquid id="factorial" language="javascript" height="100px" showButton=true content=
"function factorial(n, acc = 1) {
  if (n === 0) return acc;
  return factorial(n - 1, acc * n);
}

factorial(15000);"%}


In environments that support TCO, this code would execute without errors.
Unfortunately, most JavaScript engines do not implement it, even though it was specified in ES6 for strict mode. You can find more information on why it lacks support [here][tco-support].

---

## Mitigating the Problem: The Trampoline Technique

One solution to avoid stack overflow, besides avoiding recursion of course, is the **trampoline** technique, which transforms recursion into an iterative process by controlling execution manually.

### Trampoline Implementation in JavaScript

Here's how a trampoline works:

1. Modify the recursive function to return a **thunk**, which is a function encapsulating the next computation.
2. Use a loop to repeatedly execute the thunks until the value returned is not a function. This means the recursion hit the base case.

{% include editor.html.liquid id="trampoline" language="javascript" height="280px" showButton=true content=
"function trampoline(fn) {
  return  (...args) => {
    let result = fn(...args);
    while (typeof result === 'function') {
      result = result();
    }
    return result;
  };
}

function factorialThunk(n, acc = 1) {
  if (n === 0) return acc;
  return () => factorialThunk(n - 1, acc * n);
}

const safeFactorial = trampoline(factorialThunk);

safeFactorial(100000);"%}

By breaking recursion into thunks and processing them iteratively, this technique avoids the call stack limitations of JavaScript.

---

## How ClojureScript deals with recursion

Languages like **ClojureScript**, which compile to JavaScript, implement a native workaround for TCO.
In **Clojure**, `recur` is used to achieve efficient recursion by enforcing TCO in a controlled manner. 
In **ClojureScript**, the compiler rewrites recursion as iterative loops during the compilation process. 
This transformation ensures that recursive calls do not cause stack growth.


Here's how the factorial example would look in **ClojureScript**:

{% include editor.html.liquid id="clojure_script_factorial" language="clojure" height="100px" content=
"(defn factorial [n acc]
  (if (= n 1) 
      acc 
      (recur (dec n) (* acc n))))

(println (factorial 15000 1));; Executes without stack overflow"%}


Here's what the compiled code looks like:

{% include editor.html.liquid 
id="clojure_script_factorial_compiled" 
language="javascript" 
height="210px" 
showButton=false 
content=
"cljs.user.factorial = (function cljs$user$factorial(n,acc){
  while(true){
    if(cljs.core._EQ_.call(null,n,(1))){
      return acc;
    } else {
      var G__28 = (n - (1));
      var G__29 = (acc * n);
      n = G__28;
      acc = G__29;
      continue;
    }
    break;
  }
});"%}

---

## Conclusion

Recursion is a powerful tool to solve complex problems but it comes with limitations in JavaScript due to the lack of consistent TCO support. 
Techniques like trampolining can make recursive algorithms safe, while alternative languages like ClojureScript provide a workaround natively.


[tco-support]: https://stackoverflow.com/questions/54719548/tail-call-optimization-implementation-in-javascript-engines/54721813#54721813