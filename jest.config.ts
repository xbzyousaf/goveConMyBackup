// export default {
//   preset: "ts-jest",
//   testEnvironment: "node",

//   testMatch: ["**/server/**/*.test.ts"],
//   testPathIgnorePatterns: ["/node_modules/", "/client/"],

//   moduleNameMapper: {
//     "^@shared/(.*)$": "<rootDir>/shared/$1",
//     "^server/(.*)$": "<rootDir>/server/$1",
//     "^constants/(.*)$": "<rootDir>/constants/$1",
//   },

//   setupFiles: ["dotenv/config"],

//   transform: {
//     "^.+\\.ts$": ["ts-jest", { diagnostics: false }],
//   },
//    // 🔥 ADD THIS LINE
//   clearMocks: true,
//   resetModules: true,
// };