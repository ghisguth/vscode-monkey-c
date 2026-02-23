import Toybox.Lang;
using Toybox.System;
using Toybox.Application;
using Toybox.WatchUi as Ui;
using Toybox.Graphics as Gfx;

// Typedefs
typedef MyNumber as Number;
typedef ObjectMap as Dictionary<Symbol, Object>;

// 1. Anonymous Enum
enum {
    VAL_1,
    VAL_2 = 10,
    VAL_3
}

// 2. Named Enum
enum Align {
    LEFT,
    CENTER,
    RIGHT
}

// 3. Public Enum
public enum Color {
    RED = 0xFF0000,
    GREEN = 0x00FF00,
    BLUE = 0x0000FF
}

(:glance)
class MyClass extends Ui.View {
    // 4. Private Enum inside class
    private enum State {
        STATE_IDLE,
        State_BUSY
    }

    public var myVar as Boolean;
    private var myOtherVar as Number;
    protected var str as String = "test";

    // Constant
    const MY_CONSTANT = 3.14159;

    public function initialize() {
        View.initialize();
        myVar = true;
        myOtherVar = 5;
    }

    // Annotation
    (:test)
    private function doSomething(input as Object) as Void {
        // Type casting and instanceof
        if (input instanceof Number) {
            var casted = input as Number;
            System.println(casted);
        } else if (input has :foo) {
            System.println("Has foo");
        } else if (input == null || input == NaN) {
            System.println("Invalid");
        }

        // Arrays and Dictionaries
        var d = new Dictionary();
        var a = new Array<Float>();
        var arr = [1, 2, 3];
        var dict = { :key => "value", :otherKey => 123, :nested => { :sub => true } };

        // Symbols
        var mColor = params.get(:color);
        var x0 = params.get(:x0);
        var y0 = params.get(:y0);

        // Long line that should NOT wrap (if limit is 120)
        Gfx.drawLine(0, 2 * height / ACTION_COUNT, width, 2 * height / ACTION_COUNT, 0, 2 * height / ACTION_COUNT);

        // Ternary operator
        var result = (myVar == true) ? :yes : :no;

        // Switch statements
        switch (myOtherVar) {
            case 1:
                System.println("One");
                break;
            case :two:
                System.println("Two");
                break;
            default:
                System.println("Other");
                break;
        }

        // Try/catch
        try {
            var crash = 1 / 0;
        } catch (ex instanceof Lang.Exception) {
            System.println("Caught exception: " + ex.getErrorMessage());
        } finally {
            System.println("Done");
        }
    }

    // Complex return type
    public function getViews() as [Views] or [Views, InputDelegates] {
        return [new MyView()];
    }

    // Dictionary in function call
    public function testDictParam() {
        Ui.initialize({ :title => "Settings", :options => { :a => 1, :b => 2 } });
    }
}
