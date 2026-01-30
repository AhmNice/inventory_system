import { Equipment } from "../model/Equipments.js";
import { Request } from "../model/Request.js";
import { Transaction } from "../model/Transaction.js";

export const checkOut = async (req, res) => {
  const { request_id, equipment_id } = req.body;
  const user = req.user;
  try {
    const request = await Request.findById(request_id);
    if (!request || request.status === "pending") {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }
    const equipment = await Equipment.findById(equipment_id);
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found",
      });
    }
    const request_equipment = request.items.find(
      (item) => item.equipment_id === equipment_id,
    );

    if (!request_equipment) {
      return res.status(404).json({
        success: false,
        message: "Requested equipment not found",
      });
    }

    if (equipment.quantity < request_equipment.quantity) {
      return res.status(400).json({
        success: false,
        message: "Insufficient equipment quantity",
      });
    }

    const transaction_exist = await Transaction.findByRequest({
      request_id,
      equipment_id,
    });
    console.log(transaction_exist)
    if (transaction_exist && transaction_exist.checked_out) {
      return res.status(400).json({
        success: false,
        message: "Equipment has already been check out",
      });
    }

    await Transaction.create({
      user_id: request.user_id,
      request_id:request_id,
      good_id: equipment_id,
      equipment_id,
      quantity: request_equipment.quantity,
      type: "outgoing",
      scanned_by: user.user_id,
      checked_out:true,
      notes:"Checked"
    });

    await Equipment.reduceQuantityByOne(equipment_id)
    return res.status(200).json({
      success: true,
      message: "Equipment checked out",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
