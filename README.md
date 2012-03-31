# ES.next Experiments

This project contains example files of the various language extensions that are being considered for inclusion in the [next editions of the ECMA Language Specification](http://wiki.ecmascript.org/doku.php?id=harmony:harmony).
The purpose of examples is to test the utility, writability, and readability of proposed features.
There is no guarentee that any of these will actually be incorporated into the language. 


# Testing Class Definition Patterns

These examples exercise various patterns for defining class-like abstractions.  They use a
JavaScript implementation of the Smalltalk-80 collection class hierarchy as an example of a
rich class library that someone might want to implement using JavaScript.

The basic idea of these experiments is to explore using patterns of compositional operators instead of a built-in class declaration syntactic structure.

The experiments are:

 * ST80collections-exp1.js This is the basic experiment using <| and .{ and the compositional operators
 * ST80collections-exp1-nocomma.js Just like exp1, except that it consider the comma is optional after a concise method or put/get property within an object literal
 * ST80collections-exp1-nc-narcissus.js Just like exp1-nocomma, except that it only uses features that are support by the version of Narcissus at <https://github.com/allenwb/narcissus>
 * ST80collections-exp2.js This is the same experiment using <| and .={ and the compositional operators
 * ST80collections-exp3.js This is the same experiment using <| and .+{ and the compositional operators
 * ST80collections-exp0.js This is a baseline  using <| and the Object.extend() function as the compositional operators
 * ST80collections-exp0-blp.js This is just like exp0 but uses block lambdas with paren free calls
 * ST80collections-exp6.js This is the same as exp1 but using the operator keyword "beget" in place of <| 
 * ST80collections-exp7.js This is the same as exp1 but using :: in place of <| 
 * ST80collections-exp8.js This is the same as exp1 but using ::: in place of <| 
 
 * ST80collections-exp9.js User maximal minimal class def syntax, .{, and arrow functions 
 * ST80collections-exp10.js User maximal minimal class def syntax, and arrow functions, but no .{
 * ST80collections-exp11.js Just like exp9 but using <| and .{ instead of class defs

