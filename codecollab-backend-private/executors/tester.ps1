# ===============================
# ENVIRONMENTS
# ===============================
$environments = @(
    @{
        Name = "DEPLOYED"
        Title = "🌐 Testing DEPLOYED containers (Render)"
        Urls = @{
            "cpp"    = "https://cpp-executor-y1tt.onrender.com"
            "java"   = "https://java-executor-dtnr.onrender.com"
            "node"   = "https://node-executor.onrender.com"
            "python" = "https://python-executor-cqlx.onrender.com"
        }
    },
    @{
        Name = "LOCAL"
        Title = "🐳 Testing LOCAL containers (Docker)"
        Urls = @{
            "cpp"    = "http://localhost:5003"
            "java"   = "http://localhost:5002"
            "node"   = "http://localhost:5004"
            "python" = "http://localhost:5001"
        }
    }
)

# ===============================
# CODE SNIPPETS
# ===============================
$helloCode = @{
    "cpp"    = '#include <iostream>
int main(){ std::cout<<"Hello, World!"; }'
    "java"   = 'public class Main { public static void main(String[] a){ System.out.println("Hello, World!"); }}'
    "node"   = 'console.log("Hello, World!")'
    "python" = 'print("Hello, World!")'
}

$inputCode = @{
    "cpp"    = '#include <iostream>
int main(){ int x; std::cin>>x; std::cout<<x*2; }'
    "java"   = 'import java.util.*; public class Main{ public static void main(String[] a){ Scanner s=new Scanner(System.in); int x=s.nextInt(); System.out.println(x*2); }}'
    "node"   = 'const fs=require("fs"); const x=parseInt(fs.readFileSync(0,"utf8")); console.log(x*2);'
    "python" = 'x=int(input()); print(x*2)'
}

$inputValue = "5"
$expected   = "10"

# ===============================
# TEST EXECUTION
# ===============================
foreach ($env in $environments) {

    Write-Host "`n============================================"
    Write-Host $env.Title -ForegroundColor Cyan
    Write-Host "============================================"

    foreach ($lang in $env.Urls.Keys) {

        Write-Host "`n-----------------------------"
        Write-Host "Testing $lang".ToUpper() -ForegroundColor Yellow
        Write-Host "-----------------------------"

        $baseUrl = $env.Urls[$lang]

        # 1️⃣ HEALTH CHECK
        try {
            $health = Invoke-RestMethod "$baseUrl/health"
            Write-Host "✅ Health OK: $health"
        } catch {
            Write-Host "❌ Health FAILED" -ForegroundColor Red
            continue
        }

        # 2️⃣ HELLO WORLD
        try {
            $body = @{ code = $helloCode[$lang]; input = "" } | ConvertTo-Json -Compress
            $resp = Invoke-RestMethod "$baseUrl/execute" -Method POST -Body $body -ContentType "application/json"
            Write-Host "Hello World Output: $($resp.output.Trim())"
        } catch {
            Write-Host "❌ Hello World FAILED" -ForegroundColor Red
        }

        # 3️⃣ INPUT TEST
        try {
            $body = @{ code = $inputCode[$lang]; input = $inputValue } | ConvertTo-Json -Compress
            $resp = Invoke-RestMethod "$baseUrl/execute" -Method POST -Body $body -ContentType "application/json"

            $out = $resp.output.Trim()
            Write-Host "Input $inputValue Output: $out"

            if ($out -eq $expected) {
                Write-Host "✅ Input Handling SUCCESS" -ForegroundColor Green
            } else {
                Write-Host "❌ Input Handling FAILED (Expected $expected)" -ForegroundColor Red
            }
        } catch {
            Write-Host "❌ Input Execution FAILED" -ForegroundColor Red
        }
    }
}
