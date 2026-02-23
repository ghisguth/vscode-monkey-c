import Toybox.Lang;
using Toybox.System;

typedef MyNumber as Number;

class MyClass {
    public var myVar as Boolean;
    private var myOtherVar as Number;
    protected var str as String = "test";

    public function initialize() {
        myVar = true;
        myOtherVar = 5;
    }

    private function doSomething(input as Object) as Void {
        if (input instanceof Number) {
            var casted = input as Number;
            System.println(casted);
        } else if (input has :foo) {
            System.println("Has foo");
        } else if (input == null || input == NaN) {
            System.println("Invalid");
        }
        
        var d = new Dictionary();
        var a = new Array<Float>();
    }
}
