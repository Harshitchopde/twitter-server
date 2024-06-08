import { initServer } from "./app";
import {config} from"dotenv"
async function init(){
    const app = await initServer();
    config();
    app.listen(8800,()=> console.log("Server started at port 8800"))
    return app;
}
init();