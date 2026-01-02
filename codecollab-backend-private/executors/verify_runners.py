
import http.client
import json
import time

RUNNERS = {
    "python": {"port": 5001, "code": "x = input(); print(f'Result: {int(x)*2}')", "input": "21", "expected": "Result: 42"},
    "java": {
        "port": 5002, 
        "code": "import java.util.Scanner; public class Main { public static void main(String[] args) { Scanner s = new Scanner(System.in); int x = s.nextInt(); System.out.println(\"Result: \" + (x * 2)); } }",
        "input": "21",
        "expected": "Result: 42"
    },
    "cpp": {
        "port": 5003,
        "code": "#include <iostream>\nint main() { int x; std::cin >> x; std::cout << \"Result: \" << (x * 2) << std::endl; return 0; }",
        "input": "21",
        "expected": "Result: 42"
    },
    "node": {
        "port": 5004,
        "code": "const fs = require('fs'); const input = fs.readFileSync(0, 'utf8'); console.log('Result: ' + (parseInt(input.trim()) * 2));",
        "input": "21",
        "expected": "Result: 42"
    }
}

def check_health(name, port):
    try:
        conn = http.client.HTTPConnection("localhost", port)
        conn.request("GET", "/health")
        resp = conn.getresponse()
        data = resp.read().decode()
        if resp.status == 200:
            print(f"✅ {name.upper()} Health: {data} (OK)")
            return True
        else:
            print(f"❌ {name.upper()} Health: Status {resp.status}")
            return False
    except Exception as e:
        print(f"❌ {name.upper()} Health: Connection Failed ({e})")
        return False

def test_execute(name, port, code, input_val=None):
    try:
        conn = http.client.HTTPConnection("localhost", port)
        payload = {"code": code}
        if input_val:
            payload["input"] = input_val
        
        headers = {'Content-Type': 'application/json'}
        conn.request("POST", "/execute", json.dumps(payload), headers)
        resp = conn.getresponse()
        data = json.loads(resp.read().decode())
        
        status = data.get("status")
        output = data.get("output", "").strip()
        error = data.get("error", "")
        
        if status == "COMPLETED":
            print(f"✅ {name.upper()} Execution: Success")
            print(f"   Output: {output}")
            return output
        else:
            print(f"❌ {name.upper()} Execution: {status}")
            print(f"   Error: {error}")
            return None
    except Exception as e:
        print(f"❌ {name.upper()} Execution: Failed ({e})")
        return None

if __name__ == "__main__":
    print("=== STARTING RUNNER VERIFICATION ===\n")
    for name, config in RUNNERS.items():
        print(f"--- Testing {name.upper()} ---")
        if check_health(name, config["port"]):
            # Test Hello World (No Input)
            print(f"   Testing Code (No Input)...")
            test_execute(name, config["port"], "print('Hello')" if name == "python" else "console.log('Hello')" if name == "node" else config["code"], None)
            
            # Test With Input
            print(f"   Testing Code (With Input: {config['input']})...")
            out = test_execute(name, config["port"], config["code"], config["input"])
            if out and config["expected"] in out:
                print(f"   ✅ Input Handling: SUCCESS")
            else:
                print(f"   ❌ Input Handling: FAILED (Expected {config['expected']})")
        print()
    print("=== VERIFICATION COMPLETE ===")
