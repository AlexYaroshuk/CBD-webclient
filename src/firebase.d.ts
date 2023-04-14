declare module "../firebase" {
    import { App } from "firebase/app";
    import { Auth } from "firebase/auth";
    import { Database } from "firebase/database";

    const app: App;
    const auth: Auth;
    const database: Database;

    export { app, auth, database };
    export default app;
}
