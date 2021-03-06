/*****
This file contains an experimental translation of portions of the Smalltalk-80 Collections
class hierarchy into a dialect of JavaScript that includes features that are under consideration
for inclusion in future editions of the ECMAScript language specification.

The purpose of this translation is to test the expressiveness of the extended language.

***** This Version uses maximally minimal class declarations, and the .{ operator.
***** It also uses arrow functions.


This code has not been tested.  It undoubtably has bugs and may have syntax errors.

It is primarily based upon the description of the Collections classes in Chapter 13 of the
Smalltalk blue book (http://stephane.ducasse.free.fr/FreeBooks/BlueBook/ ) with an occasional
peak at the Squeak V1 (http://ftp.squeak.org/1.3/SqueakV1.sources.gz) Collection classes which
are a direct derivative of Xerox Smalltalk-80.  The class comments are taken directly from Squeak.

The Xerox and Apple sources for Squeak are licensed under the Apache V2.0 License
(see http://www.squeak.org/SqueakLicense/).

Original material in this file was written by Allen Wirfs-Brock and is

Copyright Mozilla Foundation, 2011

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file
except in compliance with the License. You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the
license is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
either express or implied. See the License for the specific language governing permissions
and limitations under the License.

*****/

/*****
The code uses the following proposed ES.next extension:
   *  modules and modules exports
   *  maximally minimal class declarations 
   *  the .{ operator -- extends the LHS object with properties from an object literal
   *  arrow function syntax
   *  concise method properties in obj lits - foo() {} defines a non-enumerable function data property
   *  let and const declarations
   *  super propertry references
   *  private names created via Name.create
   *  using @identifier in the propertyname position in class definitions and object literal, evaluate the expr to get a private name
   
Maximally minimal class declarations have the form
   class  <className> extends <expr> {
      construtor (<arguments>) {<body>}
      methodName (<arguments>) {<body>}
      ...
    }

Such class declaration only define the construtor and prototype object methods
In this version, instance variables are created via this.{} object extensions in the constructor.
Class method class properties are created by using .{} with the class object.

Private named properties are defined within object literals (and class declarations) as follows:

const pname1 = Name.create();  //create a new private name and bind it to a const
const pname2 = Name.create();  
let obj = {
  regularName: 0,
  @pname1: 1,  // a data property with a private name
  @pname2@() {reurn this.@pname1} //a method data property with a private name
};


******/

module SmalltalkCollections {	
	
  //define a non constructible superclass that provides some Smalltalk-like conventions
  class AbstractClass {
		get class() {return this.constructor}
		error(message) {throw new Error(message)}
		subclassResponsibility() {return this.class.subclassResponsibility()}
		shouldNotImplement() {return this.class.shouldNotImplement()}
		errorSubscriptBounds(index) {this.error("subscript is out of bounds: "+index)}
  }
  AbstractClass.{
	  subclassResponsibility() {throw new Error(this.className+" did not implemented an abstract method")}
	  shouldNotImplement() {throw new Error(this.className+" should not implemented by "+this.name)}
	  className: "AbstractClass"
  }
	
  /*-------------------------- Collection --------------------------*/
  /* I am the abstract superclass of all classes that represent
     a group of elements.
  */
	
  export class Collection extends AbstractClass  {
      constructor (n) {}
	  //adding protocol
	  add(anObj) {this.subclassResponsibility()}
	  addAll(aCollection) {
		aCollection.do( each => this.add(each));
		return this;
	  }
	  //removing protocol
	  removeIfAbsent(anObj,errHandler) {return this.subclassResponsibility()}
	  remove(anObj) {
		this.removeIfAbsent(anObj, => this.errorNotFound());
		return this;
	  }
	  removeAll(aCollection) {
		aCollection.do(each => this.remove(each));
		return aCollection;
	  }
	  //testing protocol
	  isEmpty() {return this.size == 0},
	  includes(anObj) {
		try {
		  this.do(each => {if (anObj === each) throw "object found"});
		} catch (e) {
		  if (e==="object found") return true;
		  else throw e;
		};
		return false;
	  }
	  occurencesOf(anObj) {
		let tally = 0;
		this.do(each => {if (anObj===each) ++tally});
		return tally;
	  }
	  //accessing
	  get size() {
		 let tally = 0;
		 this.do(each => ++tally);
		 return tally;
	  }
	  //enumerating protocol
	  do(func) {this.subclassResponsibility()}
	  collect(func) {
		const newCollection = new this.species;
		this.do(each => newCollection.add(func(each)));
		return newCollection;
	  }
	  detect(pred) {
		return this.detectIfNone(pred,=> {this.errorNotFound());
	  }
	  detectIfNone(pred,exceptFunc) {
		try {
		  this.do(each => {if (pred(each)) throw {detected:each});
		} catch (e) {
		  if (e.hasOwnProperty('detected')) return e.detected;
		  else throw e;
		};
		return exceptFunc();
	  }
	  injectInto(thisValue,binaryFunc) {
		let nextValue = thisValue;
		this.do(each => nextValue = binaryFunc(nextValue,each));
		return nextValue;
	  }
	  reject(pred) {
		return this.select(element => !pred(element));
	  }
	  select(pred) {
		const newCollection = new this.species();
		this.do(each => {if (pred(each)) newCollection.add(each)});
		return newCollection;
	  }
	  //converting protocol
	  asBag() {
		const aBag = new Bag();
		this.do(each => aBag.add(each));
		return aBag;
	  }
	  asOrderedCollection() {
		const anOrderedCollection = new OrderedCollection(this.size);
		this.do(each => anOrderedCollection.addLast(each));
		return anOrderedCollection;
	  }
	  asSet() {
		const aSet = new Set();
		this.do(each => aSet.add(each));
		return aSet;
	  }
	  asSortedCollection(sortFunc) {
		const aSortedCollection = new SortedCollection(this.size);
		if (sortFunc) aSortedCollection.sortFunction = sortFunc;
		aSortedCollection.addAll(this);
		return aSortedCollection;
	  }
	  //printing protocol
	  printOn(aStream) {
		const tooMany = aStream.position + this.maxPrint;
		aStream.nextPutAll(this.class.className+'(');
		try {
		  this.do(element => {
			if (aStream.position > tooMany) {
			  aStreamNextPutAll('....etc...)');
			  throw "too long";
			};
			if (element.printOn) element.printOn(aStream);
			else aStream.nextPutAll(element.toString());
		  });
		} catch(e) {
			 if (e==="too long") return this;
			 else throw e;
		};
		aStream.nextPut(')');
		return this;
	  }
	  storeOn(aStream) {
		 throw error("the Smalltalk serialization format isn't appropriate for JavaScript");
	  }
	  //private protocol for subclasses ("protected" in Java/c++ speak)
	  get species() {return this.constructor}
	  errorNotFound() {this.error("Object is not in the collection")}
	  errorNotKeyed() {this.error(this.class.className+"s do not respond to keyed accessing messages")}
	  errorEmptyCollection() {this.error("this collection is empty")}
	  emptyCheck() {
	    if (this.isEmpty()) this.errorEmptyCollection();
	  }
	  get maxPrint() {return 5000} //max size of a printOn string
  }
  Collection.{
    with(...args) {
      const newCollection = new this(args.length);
      args.forEach(element => newCollection.add(element));
      return newCollection;
    },
    className: "Collection",
    nil: {} //object used to indicate an empty slot in a collection
  };
  Object.defineProperty(Collection,'nil', {writable: false,configurable:false,enumerable:false});
	
  /*-------------------------- Set --------------------------*/
  
  const setContents = Name.create(), setTally = Name.create();
	
  export class Set extends Collection {
    constructor(initialSize=2) {   
	   this.{
		  @setContents: new Array(initialSize),
		  @setTally: 0
	};
    //accessing protocol
    at(index) {return this.errorNotKeyed()}
    atPut(index, anObject) {return this.errorNotKeyed()}
    get size() {return this.@setTally}
    //testing protocol
    includes(anObject) {return this.@setContents[this.findElementOrNil(anObject)]!==Collection.nil}
    occurrencesOf(anObject) { return this.includes(anObject) ? 1 : 0} 
    //adding protocol
    add(newObject) {
       const index = this.findElementOrNil(newObject);
       if (this.@setContents[index]===Collection.nil) {
         this.@setContents[index]=newObject;
         ++this.@setTally;
       }
       return newObject;
    }
    //removing protocol
    removeIfAbsent(oldObject,exceptionBlock) {
       const marker={};
       let notFound = marker;
       const index = this.findIfAbsent(oldObject, => notFound=exceptionBlock());
       if (notFound!==marker) return notFound;
       this.@setContents[index]=Collection.nil;
       --this.@setTally;
       this.fixCollisionsFrom(index);
       return oldObject;
    }
    //enumerating protocol
    do(func) {
       const contents=this.@setContents;
       for (let index=0,len=contents.length; index < len;++index) {
         const element=contents[index];
         if (element!==Collection.nil) func(element);
       };
       return this;
    }
    //"protected" internal methods that access bagContents as a hash table
    findElementOrNil(anObject) {
       throw "need to implement Set.prototype.findElementOrNil";
    }
    findIfAbsent(anObject,func) {
       throw "need to implement Set.prototype.findIfAbsent";
    }
    fixCollisionsFrom(index) {
       throw "need to implement Set.prototype.fixCollisionsFrom";
    }
  }
  Set.{
	className: "Set"
  };

  /*-------------------------- Bag --------------------------*/
  /*I represent an unordered collection of possibly duplicate elements.

    I store these elements in a dictionary, tallying up occurrences of
    equal objects. Because I store an occurrence only once, my clients
    should beware that objects they store will not necessarily be
    retrieved such that === is true. If the client cares, a subclass
    of me should be created.
  */

  const bagContents = Name.create();
	
  export class Bag extends Collection {
    constructor() {
	   this.{
		  @bagContent: new Dictionary()
	   };
	}
    //accessing protocol
    at(index) {return this.errorNotKeyed()}
    atPut(index, anObject) {return this.errorNotKeyed()}
    get size() {
       let tally = 0;
       this.@bagContents.do(each => ++tally);
       return tally;
    }
    //testing protocol
    includes(anObject) {return this.@bagContents.includesKey(anObject)}
    occurrencesOf(anObject) {
       return this.includes(anObject) ? this.@bagContents.at(anObject) : 0;
    }
    //adding protocol
    add(newObject) {return this.addWithOccurrences(newObject,1)}
    addWithOccurrences(newObject,anInteger) {
       this.@bagContents.atPut(newObject,Math.round(anInteger)+this.occurrencesOf(newObject));
       return newObject;
    }
    //removing protocol
    removeIfAbsent(oldObject,exceptionBlock) {
       const count = this.occurrencesOf(oldObject);
       switch  (count) {
           case 0: return exceptionBlock();
           case 1:
         	   this.@bagContents.removeKey(oldObject);
         	   break;
           default:
         	   this.@bagContents.atPut(oldObject,count-1);
       };
       return oldObject;
    }
    //enumerating protocol
    do(func) {
       this.@bagContents.associationsDo(assoc=>
         {for (let i=0,count=assoc.value; i < count;++i) func(assoc.key)});
       return this;
    }
  }
  Bag.{
    className: "Bag"
  };

	/*-------------------------- Dictionary --------------------------*/
	/*I represent a set of elements that can be viewed from one of two
	perspectives: a set of associations, or a set of values that are
	externally named where the name can be any object that responds
	to =. The external name is referred to as the key.
	*/
	
  export class Dictionary extends Set {
    constructor(...args) {
	   super(...args);
	}
    //accessing protocol
    at(key) {return this.atIfAbsent(key,=>this.errorKeyNotFound()}
    atPut(key, anObject) {
      const index = this.findKeyOrNil(key);
      const element = this@.setContents[index];
      if (element===Collection.nil) {
    	  this.@setContents[index]= {key: key, value: anObject};
    	  ++this.@setTally;
      } else element.value = anObject;
      return anObject;
    }
    atIfAbsent(key,func) {
  	const marker={};
  	let notFound = marker;
  	const index = this.findKeyIfAbsent(key,=>notFound=func());
  	if (notFound!==marker) return notFound;
  	return this.@setContents[index].value;
    }
    //testing protocol
    includes(anObject) {
  	  /*revert to the implementation in Collection*/
  	  return Collection.prototype.includes.call(this,anObject);
    }
    //adding protocol
    add(anAssociation) {
      const index = this.findKeyOrNil(anAssociation.key);
      const element = this.@setContents[index];
      if (element===Collection.nil) {
        this.@setContents[index]= anAssociation;
        ++this.@setTally;
      } else element.value = anAssociation.value;
      return anAssociation;
    }
    //removing protocol
    removeIfAbsent(anObject,exceptionBlock) {
  	  this.shouldNotImplement();
    }
    //enumerating protocol
    do(func) {
  	   this.associationsDo(function(assoc) {func(assoc.value)});
  	   return this;
    }
    associationsDo(func) {
  	  super.do(func);   //  <---- note super call to different method
  	  return this;
    }
    collect(func) {
  	  const newCollection = new Bag;
  	  this.do(each => newCollection.add(func(each)));
  	  return newCollection;
    }
    select(pred) {
  	  const newCollection = new this.species();
  	  this.associationsDo(each => {if (pred(each.value)) newCollection.add(each)});
  	  return newCollection;
    }
    //"protected" internal methods that access bagContents as a hash table
    findKeyOrNil(key) {
  	  throw "need to implement Dictionary.prototype.findKeytOrNil";
    }
    findKeyIfAbsent(key,func) {
  	  throw "need to implement Set.prototype.findKeyIfAbsent";
    }
    errorKeyNotFound() {this.error("Key not found in "+this.class.name)}
  };
  Dictionary.{
    className: "Dictionary"
  };
	
	/*-------------------------- SequenceableCollection --------------------------*/
	/* I am an abstract superclass for collections that have a well-defined order
	associated with their elements. Thus each element is externally-named by
	integers referred to as indices.
	*/

  export class  SequenceableCollection extends Collection {
    constructor(){super()}
    //accessing protocol
    get size() {return this.subclassResponsibility()}
    //removing protocol
    removeIfAbsent() {return this.shouldNotImplement()}
    //enumerating protocol
    do(func) {
  	  let index = 0;
  	  const length = this.size;
  	  while (++indexM<=length) func(this.at(index));
  	  return this;
	}
  };
  SequenceableCollection.{
    className: "SequenceableCollection"
  };
	
	/*-------------------------- BasicStorageCollection --------------------------*/
    /* This is an implementation class that doesn't exist in the Smalltalk
    implementation.  It adds a JavasScript Array based backing store to
    a collection in order to simulate the array state of a Smalltalk object.
    Because Smalltalk arrays 1-origined we bias the size by 1 in order to
    preserve the Smalltalk algorithrms */
    
	
	//Interval private instance variables
  const storage=Name.create();  
  
  class BasicStorageCollection extends SequenceableCollection {
    constructor(elements) {
  	  super();
  	  this.{
  	    @storage: new Array(elements+1)
  	  };
    }
    //"protected" methods for storage access
    get basicSize() {return this.@storage.length-1}
    basicAt(index) {return this.@storage[index]}
    basicAtPut(index,value) {
  	 this.@storage[index] = value;
  	 return value;
    }
  }
  BasicStorageCollection.{
    className: "BasicStorageCollection",
  };

	
	/*-------------------------- ArrayCollection --------------------------*/
	/* I am an abstract collection of elements with a fixed range of integers
	(from 1 to n>=1) as external keys.
	*/
  export class ArrayedCollection extends SequenceableCollection {
    constructor(elements=0) {super(elements)}
	//accessing protocol
	get size() {return this.basicSize}
	at(index) {return this.basicAt(Math.floor(index))}
	atPut(index,value) {return this.basicAtPut(Math.floor(index),value)}
	//adding protocol
	add(newObject) {this.shouldNotImplement()}
	//protected methods for storage access
  }
  ArrayedCollection.{
    newWithAll(size,value) {return (new this(size)).atAllPut(value)},
	with(...args) {
	  const newCollection = new this(args.length);
	  let i = 1;
	  args.forEach(element => newCollection.atPut(i++,element));
	  return newCollection;
    },
	className: "ArrayedCollection"
  };

	/*-------------------------- Smalltalk Array --------------------------*/
	/* I present an ArrayedCollection whose elements are objects.
	*/

  export class SmalltalkArray extends ArrayedCollection {
    constructor(elements=0) {super.constructor(elements)}
    //converting protocol
	asArray() {return this}
  }
  SmalltalkArray.{
    className: "(Smalltalk)Array"
  };
	

	/*-------------------------- Interval --------------------------*/
  //Interval private instance variables
  const start=Name.create(), stop=Name.create(), step=Name.create();
	
  export class Interval extends SequenceableCollection {
    consructor() {super()}
    //accessing protocol
    get size() {
      if (this.@step < 0 )
        return this.@start < this.@top ? 0 : Math.floor((this.@stop-this.@start) / this.@step)+1;
      else return this.@stop < this.@start ? 0 : Math.floor((this@stop-this.@start) / this.@step)+1;
    }
    at(index) {
      if (index >= 1 && index <= this.size) return this.@start+(this.@step*(index-1));
      else this.errorSubscriptBopunds(index);
    }
    atPut() {this.error("you cannot store into an Interval")}
    //adding protocol
    add() {this.error("elements cannot be added to an Interval")}
    //removing protocol
    remove() {this.error("elements cannot be removed from an Interval")}
    //enumerating protocol
    do(func) {
      let aValue = this.@start;
      if (this.@step<0) {
        while(this.@stop<=aValue) {
    	  func(aValue);
    	  aValue += this.@step;
    	}
      } else {
        while(this.@stop>=aValue) {
    	  func(aValue);
    	  aValue += this.@step;
        }
      };
      return this;
    }
    collect(func) {
      const result = new this.species(this.size);
      let nextValue = this.@start;
      let i = 1;
      if (this.@step<0) {
        while(this.@stop<=nextValue) {
    	  result.atPut(i++,func(nextValue));
    	  aValue += this.@step;
    	}
      } else {
        while(this.@stop>=nextValue) {
    	  result.atPut(i++,func(nextValue));
    	  aValue += this.@step;
    	}
      };
      return this;
    }
    //private
    get species(){return SmalltalkArray}
  }
  Interval.{
	fromTo(startInteger,stopInteger) {return this.fromToBy(startInteger,stopInteger,1)}
	fromToBy(startInteger,stopInteger,stepInteger) {
	  return (new this).{
	    @start: Math.round(startInteger),
	    @stop:  Math.round(stopInteger),
	    @step:  Math.round(stepInteger)
	  }
	},
	className: "Interval"	     
  };
	  
	/*-------------------------- OrderedCollection --------------------------*/
	/* I represent a collection of objects ordered by the collector.
	*/
	
  //Interval private instance variables
  const firstIndex=Name.create(), lastIndex=Name.create();
	
  export class OrderedCollection extends BasicStorageCollection {
    constructor(space=10) {
      super(space);
      const firstIndx = Math.max(Math.floor(space / 2),1);
      this.{
        @firstIndex: firstIndx,
        @lastIndex : Math.max(firstIndx-1,0)
      }
    }
    //accessing protocol
    get size() {return this@.lastIndex-this@.firstIndex + 1}
    at(anInteger) {
      const index = Math.floor(anInteger);
      if (index < 1 || anInteger+this.@firstIndex-1 > this.@lastIndex)
        return this.errorNoSuchElement();
      return super.at(index+this.@firstIndex-1);
    }
    atPut(anInteger,anObject) {
      const index = Math.floor(anInteger);
      if (anInteger < 1 || anInteger+this.@firstIndex-1 > this.@lastIndex)
        return this.errorNoSuchElement();
      return super.atPut(anInteger+this.@firstIndex-1, anObject);
    }
    get first() {return this.at(1)}
    get last() {return this.at(this.size)}
    //adding protocol
    add(newObject) {return this.addLast(newObject)}
    addFirst(newObject) {
      if (this.@firstIndex == 1) this.makeRoomAtFirst();
      this.basicAtPut(--this.@firstIndex, newObject);
      return newObject;
    }	    
    addLast(newObject) {
      if (this.@lastIndex == this.basicSize) this.makeRoomAtLast();
      this.basicAtPut(++this.@lastIndex, newObject);
      return newObject;
    }
    addAll(aCollection) {
     aCollection.do(function(element) {this.addLast(element)});
     return aCollection;
    }
    //removing protocol
    removeFirst() {
      this.emptyCheck();
      const firstObj = this.first();
      this.basicAtPut(this.@firstIndex++,undefined);
      return firstObj;
    }
    removeLast() {
      this.emptyCheck();
      const lastObj = this.last();
      this.basicAtPut(this.@lastIndex--,undefined);
      return lastObj;
    }
    removeIfAbsent(oldObject, absentBlock) {
      let index = this.@firstIndex;
      while (index <= this.@lastIndex) {
        if (oldObject == this.basicAt(index)) {
    	  this.removeIndex(index);
    	  return oldObject;
        } else --index;
      }
      return absentBlock();
    }
    //enumerating protocol
    do(func) {
      let index = this.@firstIndex;
      while (index <= this.@lastIndex) 
        func(this.basicAt(index++));
      return this;
    }
    collect(func) {
      const newCollection = new this.species(this.basicSize);
      this.do(each => newCollection.add(func(each)));
      return newCollection;
    }
    select(pred) {
      const newCollection = new this.species(this.basicSize);
      this.do(each => {if (pred(each)) newCollection.add(each)});
      return newCollection;
    }
    //private
    errorNoSuchElement() {
    this.error('attempt to index non-existent element in an ordered collection');
    }
    emptyCheck() {/*TODO*/ }
    makeRoomAtLast() {this.@storage.length += 1}
    makeRoomAtFirst() {
      const addedSpace = Math.max(Math.floor(this.basicSize*this.growthFactor),1);
      this.@storage=(new Array(addedSpace)).concat(this.@storage);
      this.@firstIndex += addedSpace;
      this.@lastIndex += addedSpace;
    }
    get growthFactor() {return 0.20}
  }
  OrderedCollection.{
    newFrom(aCollection) {
      const newCollection = new this(aCollection.size);
      newCollection.addAdd(aCollection);
      return newCollection;
      },
    className: "OrderedCollection"
  };
        	  
}
		