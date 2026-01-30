import { pool } from "../config/db.config.js";
import { ActivityLog } from "../model/Activity_log.js";
import { Request } from "../model/Request.js";
import { getClientIp } from "../util/getIpAddress.js";
import { createObjectCsvStringifier } from "csv-writer";

export const createRequest = async (req, res) => {
  const { user_id, equipment, reason, start_date, end_date } = req.body;

  // 🔍 Validation
  if (!user_id) {
    return res.status(400).json({
      success: false,
      message: "User id is required",
    });
  }

  if (
    !equipment ||
    !Array.isArray(equipment) ||
    equipment.length === 0 ||
    !reason 
  ) {
    return res.status(400).json({
      success: false,
      message: "Required fields are missing or invalid",
    });
  }

  try {
    // 🧠 Save equipment request
    const request = new Request({
      user_id,
      reason,
      status: "pending",

    });
    await request.saveWithItems(equipment);

    return res.status(201).json({
      success: true,
      message: `${equipment.length} equipment request(s) created successfully`,
    });
  } catch (error) {
    console.error("Error while trying to create request:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
export const fetchAllRequest = async (req, res) => {
  const limit = parseInt(req.query.limit || 10);
  const offset = parseInt(req.query.offset || 0);
  try {
    const result = await Request.fetchAll({ limit, offset });
    return res.status(200).json(result);
  } catch (error) {
    console.log("Error fetching requests:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
export const updateRequestStatus = async (req, res) => {
  const { request_id, status, decline_reason } = req.body;
  const { user: activeUser } = req;

  try {
    // 1. Validate inputs
    if (!request_id || !status) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: request_id or status",
      });
    }

    // 2. Perform status update
    const response = await Request.updateStatus(
      request_id,
      status,
      activeUser,
      decline_reason
    );
    if (status === "approved") {
      // create transaction log for approved equipment request
      const requestItems = await pool.query(
        ` SELECT * FROM operation.request_items WHERE request_id =$1`,
        [request_id]
      );
      for (const items in requestItems) {
        // await
      }
    }
    // 3. Log activity
    const newActivity_log = new ActivityLog({
      severity: "info",
      user_id: activeUser.user_id,
      user_name: activeUser.name,
      user_email: activeUser.email,
      user_role: activeUser.role,
      action: `Update request status to ${status}`,
      details: `Request ID ${request_id} was updated to '${status}' by ${activeUser.name}`,
      ip_address: getClientIp(req),
      user_agent: req.headers["user-agent"],
      category: "Request Management",
      resource_type: "Request",
      affected_resource: request_id,
    });

    await newActivity_log.create();

    // 4. Respond to client
    return res.status(200).json({
      success: true,
      message: "Status updated successfully",
      data: response,
    });
  } catch (error) {
    console.error("❌ Error updating request status:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
export const download_request_csv = async (req, res) => {
  try {
    // 1️⃣ Fetch data
    const requestQuery = `
  SELECT rq.request_id, rq.user_id, u.name AS user_name, u.email AS user_email,
         u.phone_number AS user_phone,
         u.department AS user_department,
         rq.reason AS purpose,
         rq.start_date,
         rq.end_date,
         rq.status,
         rq.requested_at AS submitted_at,
         rq.approved_by,
         rq.approved_at,
         rq.declined_by,
         rq.declined_at,
         rq.decline_reason,
         rq.note,
         EXTRACT(DAY FROM (rq.end_date - rq.start_date)) AS total_days
  FROM operation.requests rq
  JOIN auth.users u ON rq.user_id = u.user_id
  ORDER BY rq.requested_at DESC
`;

    const { rows } = await pool.query(requestQuery);

    if (!rows.length) {
      return res
        .status(404)
        .json({ success: false, message: "No requests found" });
    }

    // 2️⃣ Create CSV writer (in-memory)
    const csvStringifier = createObjectCsvStringifier({
      header: Object.keys(rows[0]).map((key) => ({
        id: key,
        title: key.toUpperCase(),
      })),
    });

    // 3️⃣ Build CSV string
    const headerString = csvStringifier.getHeaderString();
    const recordsString = csvStringifier.stringifyRecords(rows);
    const csvData = headerString + recordsString;

    // 4️⃣ Set headers for download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=requests.csv");

    // 5️⃣ Send CSV
    res.send(csvData);
  } catch (error) {
    console.error("Error generating CSV:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
