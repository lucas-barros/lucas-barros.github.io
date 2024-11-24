---
layout: post
title: Optimizing JavaScript with Typed Arrays
date: 2024-11-24
---

I recently read this very interesting [LinkedIn post][original-post] benchmarking the performance between programming languages when running a loop with 1 billion iterations. 

The results were interesting, but what really caught my eye was the performance difference between the author's original JavaScript implementation and the updated one after input from the readers. The original one was using standard dynamic arrays and the updated one was using typed arrays. As pointed out by the readers, this was a more fair comparison, since the other languages were also using typed arrays.

The improvement in performance after switching to typed arrays was very noticeable from 11 seconds down to 1 second, so I decided to dig deeper to the better understand why that is.

## The JavaScript Code
### Using Standard Arrays

{% highlight JavaScript %}
const array = new Array(10000);
for (let i = 0; i < 10000; i++) {
  for (let j = 0; j < 100000; j++) {
    array[i] = array[i] + j;
  }
}
{% endhighlight %}

In this version, the array is created using the standard `Array` constructor, which creates a sparse array without pre-allocating memory or initializing its elements.

### Using Typed Arrays

{% highlight JavaScript %}
const a = new Int32Array(10000);
for (let i = 0; i < 10000; i++) {
  for (let j = 0; j < 100000; j++) {
    array[i] = array[i] + j;
  }
}
{% endhighlight %}

In this version, array is created using `Int32Array`, a typed array that pre-allocates memory and initializes 10,000 elements. 

## Why Does This Change Make a Difference?
The performance boost in the second version can be attributed to the following factors:

### Memory Allocation:

The memory for elements in a standard array is not allocated until they are explicitly assigned. This leads to differences in both memory usage and access time. This reduces the amount of memory used by the array but reaching an offset in memory is not trivial as the values are located by a key and not by an offset.

The memory for elements in a typed array is pre-allocated, and all elements are initialized to 0. This dense memory structure allows faster read/write operations.

### Type Predictability:

Standard Arrays can hold elements of mixed types, requiring runtime type checks and coercion for operations like addition. 

Typed Arrays elements are guaranteed to be of a fixed type (e.g., 32-bit integers in Int32Array). This eliminates runtime checks and allows for direct numerical operations.

### Engine Optimizations:

JavaScript engines like V8 are heavily optimized for typed arrays. Their predictable structure enables the engine to use efficient low-level operations, unlike the more general handling required for standard arrays. More about the v8 array optimizations can be found [here][v8-optimizations].

## The Results
By switching from a standard array to a typed array, the nested loop executes significantly faster, with measurable performance gains especially evident in computationally intensive tasks.

## Conclusion

High-level dynamic languages like JavaScript offer great flexibility but come with hidden performance costs, such as the overhead of dynamic typing and versatile data structures. While these inefficiencies often go unnoticed in everyday tasks, they can become significant in performance-critical scenarios. This highlights the importance of understanding the trade-offs between convenience and efficiency in software development. While standard arrays offer versatility and are suitable for general use cases, it's worth considering typed arrays when performance is a priority.



[original-post]: https://www.linkedin.com/posts/benjamin-dicken-78797a73_1-billion-loop-iterations-4-languages-activity-7263215693691592706-WzGv
[v8-optimizations]: https://v8.dev/blog/elements-kinds


