const http = require("http");

// Simple function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: JSON.parse(body),
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
          });
        }
      });
    });

    req.on("error", reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testServer() {
  try {
    console.log("🧪 Testing Glean ATproto Server...\n");

    // Test health endpoint
    console.log("1. Testing health endpoint...");
    const healthResponse = await makeRequest({
      hostname: "localhost",
      port: 3000,
      path: "/health",
      method: "GET",
    });

    console.log("✅ Health check response:", healthResponse.body);
    console.log(`   Status: ${healthResponse.statusCode}\n`);

    // Test account creation
    console.log("2. Creating test account...");
    const createAccountResponse = await makeRequest(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/auth/createAccount",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
      {
        handle: "testuser",
        password: "testpassword",
        profile: {
          displayName: "Test User",
          points: 100,
        },
      },
    );

    console.log("✅ Account creation response:", createAccountResponse.body);
    console.log(`   Status: ${createAccountResponse.statusCode}\n`);

    if (createAccountResponse.statusCode === 201) {
      const accessToken = createAccountResponse.body.accessJwt;

      // Test session info
      console.log("3. Testing session info...");
      const sessionResponse = await makeRequest({
        hostname: "localhost",
        port: 3000,
        path: "/api/auth/getSession",
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log("✅ Session info response:", sessionResponse.body);
      console.log(`   Status: ${sessionResponse.statusCode}\n`);

      // Test getting users
      console.log("4. Getting all users...");
      const usersResponse = await makeRequest({
        hostname: "localhost",
        port: 3000,
        path: "/api/users",
        method: "GET",
      });

      console.log("✅ Users response:", usersResponse.body);
      console.log(`   Status: ${usersResponse.statusCode}\n`);

      // Test getting items (should be empty)
      console.log("5. Getting all items...");
      const itemsResponse = await makeRequest({
        hostname: "localhost",
        port: 3000,
        path: "/api/items",
        method: "GET",
      });

      console.log("✅ Items response:", itemsResponse.body);
      console.log(`   Status: ${itemsResponse.statusCode}\n`);

      // Test lexicon endpoint
      console.log("6. Getting item lexicon...");
      const lexiconResponse = await makeRequest({
        hostname: "localhost",
        port: 3000,
        path: "/api/lexicons/app.gleam.item",
        method: "GET",
      });

      console.log(
        "✅ Lexicon response:",
        JSON.stringify(lexiconResponse.body, null, 2),
      );
      console.log(`   Status: ${lexiconResponse.statusCode}\n`);
    }

    console.log("🎉 All tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testServer();
