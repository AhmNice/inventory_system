import express from "express"
import { checkOut } from "../controller/checkout.controller.js"
import { verifySession } from "../util/sessions.js";

const check_out_route = express.Router()
check_out_route.post("/check-out/:equipment_id", verifySession, checkOut)
export default check_out_route