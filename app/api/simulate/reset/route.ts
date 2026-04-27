import { NextResponse } from "next/server";
import { db } from "@/db";
import { trucks, hubs, packages, riders, zones, predictions, routeHistories, alerts, bookings, trackingEvents } from "@/db/schema";

const TRUCKS = [
  {id:"TRK001",origin:"Delhi",destination:"Mumbai",current_lat:23.1,current_lng:75.8,status:"critical",delay_minutes:300,cargo:"Electronics",weight_tons:20,weather_condition:"heavy_rain",traffic_level:"blocked",driver_name:"Ramesh Kumar",current_route:["Delhi","Agra","Mumbai"]},
  {id:"TRK002",origin:"Chennai",destination:"Bangalore",current_lat:13.5,current_lng:79.1,status:"on_time",delay_minutes:0,cargo:"Textiles",weight_tons:15,weather_condition:"clear",traffic_level:"low",driver_name:"Suresh Raj",current_route:["Chennai","Bangalore"]},
  {id:"TRK003",origin:"Kolkata",destination:"Hyderabad",current_lat:20.2,current_lng:85.8,status:"delayed",delay_minutes:120,cargo:"Auto Parts",weight_tons:18,weather_condition:"rain",traffic_level:"high",driver_name:"Mohan Das",current_route:["Kolkata","Hyderabad"]},
  {id:"TRK004",origin:"Ahmedabad",destination:"Pune",current_lat:20.9,current_lng:73.8,status:"on_time",delay_minutes:0,cargo:"Pharmaceuticals",weight_tons:8,weather_condition:"clear",traffic_level:"medium",driver_name:"Vikram Patel",current_route:["Ahmedabad","Pune"]},
  {id:"TRK005",origin:"Jaipur",destination:"Delhi",current_lat:27.5,current_lng:76.2,status:"delayed",delay_minutes:90,cargo:"FMCG",weight_tons:22,weather_condition:"rain",traffic_level:"high",driver_name:"Arjun Singh",current_route:["Jaipur","Delhi"]},
  {id:"TRK006",origin:"Mumbai",destination:"Chennai",current_lat:16.5,current_lng:74.3,status:"on_time",delay_minutes:0,cargo:"Industrial Goods",weight_tons:25,weather_condition:"clear",traffic_level:"low",driver_name:"Kiran More",current_route:["Mumbai","Pune","Chennai"]},
  {id:"TRK007",origin:"Hyderabad",destination:"Kolkata",current_lat:19.8,current_lng:82.1,status:"critical",delay_minutes:240,cargo:"Perishables",weight_tons:10,weather_condition:"storm",traffic_level:"blocked",driver_name:"Ravi Sharma",current_route:["Hyderabad","Kolkata"]},
  {id:"TRK008",origin:"Bangalore",destination:"Ahmedabad",current_lat:17.4,current_lng:75.9,status:"on_time",delay_minutes:0,cargo:"Machinery",weight_tons:30,weather_condition:"clear",traffic_level:"medium",driver_name:"Anand Nair",current_route:["Bangalore","Pune","Ahmedabad"]}
];

const HUBS = [
  {id:"HUB_DEL",city:"Delhi",hub_type:"city_hub",capacity:10000,current_load:9500,status:"overloaded",lat:28.6139,lng:77.2090},
  {id:"HUB_MUM",city:"Mumbai",hub_type:"city_hub",capacity:10000,current_load:6000,status:"normal",lat:19.0760,lng:72.8777},
  {id:"HUB_BLR",city:"Bangalore",hub_type:"city_hub",capacity:8000,current_load:7200,status:"warning",lat:12.9716,lng:77.5946},
  {id:"HUB_CHE",city:"Chennai",hub_type:"city_hub",capacity:8000,current_load:4000,status:"normal",lat:13.0827,lng:80.2707},
  {id:"HUB_HYD",city:"Hyderabad",hub_type:"city_hub",capacity:7000,current_load:3500,status:"normal",lat:17.3850,lng:78.4867},
  {id:"SUB_DEL_N",city:"Delhi North",hub_type:"sub_hub",capacity:2000,current_load:1900,status:"overloaded",lat:28.7500,lng:77.1200},
  {id:"SUB_DEL_S",city:"Delhi South",hub_type:"sub_hub",capacity:2000,current_load:1200,status:"normal",lat:28.5200,lng:77.2100},
  {id:"SUB_MUM_W",city:"Mumbai West",hub_type:"sub_hub",capacity:2500,current_load:2000,status:"warning",lat:19.1000,lng:72.8200},
  {id:"SUB_BLR_E",city:"Bangalore East",hub_type:"sub_hub",capacity:1500,current_load:800,status:"normal",lat:12.9800,lng:77.6500},
  {id:"HUB_JAI",city:"Jaipur",hub_type:"city_hub",capacity:5000,current_load:1500,status:"normal",lat:26.9124,lng:75.7873},
  {id:"HUB_SUR",city:"Surat",hub_type:"city_hub",capacity:6000,current_load:3200,status:"normal",lat:21.1702,lng:72.8311},
  {id:"HUB_IND",city:"Indore",hub_type:"city_hub",capacity:5500,current_load:2800,status:"normal",lat:22.7196,lng:75.8577},
  {id:"HUB_BHO",city:"Bhopal",hub_type:"city_hub",capacity:5000,current_load:2100,status:"normal",lat:23.2599,lng:77.4126},
  {id:"HUB_NGP",city:"Nagpur",hub_type:"city_hub",capacity:6000,current_load:3800,status:"warning",lat:21.1458,lng:79.0882},
  {id:"HUB_KOC",city:"Kochi",hub_type:"city_hub",capacity:4500,current_load:1800,status:"normal",lat:9.9312,lng:76.2673},
  {id:"HUB_PAT",city:"Patna",hub_type:"city_hub",capacity:4000,current_load:1600,status:"normal",lat:25.5941,lng:85.1376},
  {id:"HUB_BBS",city:"Bhubaneswar",hub_type:"city_hub",capacity:4000,current_load:2000,status:"normal",lat:20.2961,lng:85.8245},
  {id:"HUB_VIZ",city:"Visakhapatnam",hub_type:"city_hub",capacity:5500,current_load:2900,status:"normal",lat:17.6868,lng:83.2185},
  {id:"HUB_KOL",city:"Kolkata",hub_type:"city_hub",capacity:9000,current_load:5400,status:"normal",lat:22.5726,lng:88.3639},
  {id:"HUB_PUN",city:"Pune",hub_type:"city_hub",capacity:7000,current_load:3500,status:"normal",lat:18.5204,lng:73.8567},
  {id:"HUB_AMD",city:"Ahmedabad",hub_type:"city_hub",capacity:7500,current_load:4200,status:"normal",lat:23.0225,lng:72.5714},
];

const PACKAGES = [
  {id:"PKG001",origin_hub:"HUB_DEL",destination_hub:"SUB_DEL_N",current_hub:"SUB_DEL_N",status:"stuck",stuck_hours:6,item_name:"Smartphone",priority:"express"},
  {id:"PKG002",origin_hub:"HUB_MUM",destination_hub:"SUB_MUM_W",current_hub:"HUB_MUM",status:"in_transit",stuck_hours:0,item_name:"Laptop",priority:"express"},
  {id:"PKG003",origin_hub:"HUB_BLR",destination_hub:"SUB_BLR_E",current_hub:"HUB_BLR",status:"stuck",stuck_hours:4,item_name:"Shoes",priority:"standard"},
  {id:"PKG004",origin_hub:"HUB_DEL",destination_hub:"SUB_DEL_S",current_hub:"HUB_DEL",status:"in_transit",stuck_hours:0,item_name:"Books",priority:"standard"},
  {id:"PKG005",origin_hub:"HUB_CHE",destination_hub:"HUB_HYD",current_hub:"HUB_CHE",status:"in_transit",stuck_hours:0,item_name:"TV",priority:"express"},
  {id:"PKG006",origin_hub:"HUB_DEL",destination_hub:"HUB_JAI",current_hub:"HUB_DEL",status:"stuck",stuck_hours:8,item_name:"Clothes",priority:"standard"},
  {id:"PKG007",origin_hub:"HUB_MUM",destination_hub:"HUB_BLR",current_hub:"SUB_MUM_W",status:"in_transit",stuck_hours:0,item_name:"Camera",priority:"express"},
  {id:"PKG008",origin_hub:"HUB_HYD",destination_hub:"HUB_CHE",current_hub:"HUB_HYD",status:"in_transit",stuck_hours:0,item_name:"Furniture",priority:"standard"},
  {id:"PKG009",origin_hub:"SUB_DEL_N",destination_hub:"HUB_MUM",current_hub:"SUB_DEL_N",status:"stuck",stuck_hours:5,item_name:"Watches",priority:"express"},
  {id:"PKG010",origin_hub:"HUB_BLR",destination_hub:"HUB_CHE",current_hub:"HUB_BLR",status:"in_transit",stuck_hours:0,item_name:"Groceries",priority:"standard"}
];

const RIDERS = [
  {id:"R001",name:"Arjun",zone:"Koramangala",current_lat:12.9352,current_lng:77.6245,status:"delivering",active_order_id:"ORD001",eta_minutes:8},
  {id:"R002",name:"Rahul",zone:"Koramangala",current_lat:12.9380,current_lng:77.6100,status:"delivering",active_order_id:"ORD002",eta_minutes:18},
  {id:"R003",name:"Priya",zone:"Indiranagar",current_lat:12.9784,current_lng:77.6408,status:"idle",active_order_id:null,eta_minutes:0},
  {id:"R004",name:"Deepak",zone:"Indiranagar",current_lat:12.9750,current_lng:77.6380,status:"idle",active_order_id:null,eta_minutes:0},
  {id:"R005",name:"Sneha",zone:"Whitefield",current_lat:12.9698,current_lng:77.7499,status:"delivering",active_order_id:"ORD005",eta_minutes:12},
  {id:"R006",name:"Manoj",zone:"Koramangala",current_lat:12.9300,current_lng:77.6200,status:"delivering",active_order_id:"ORD006",eta_minutes:22},
  {id:"R007",name:"Kavya",zone:"Jayanagar",current_lat:12.9250,current_lng:77.5938,status:"idle",active_order_id:null,eta_minutes:0},
  {id:"R008",name:"Ravi",zone:"Whitefield",current_lat:12.9720,current_lng:77.7520,status:"returning",active_order_id:null,eta_minutes:5}
];

const ZONES = [
  {id:"Z001",name:"Koramangala",city:"Bangalore",traffic_level:"high",avg_delivery_minutes:22,active_orders:45,available_riders:1,status:"critical"},
  {id:"Z002",name:"Indiranagar",city:"Bangalore",traffic_level:"low",avg_delivery_minutes:11,active_orders:18,available_riders:4,status:"normal"},
  {id:"Z003",name:"Whitefield",city:"Bangalore",traffic_level:"medium",avg_delivery_minutes:15,active_orders:30,available_riders:2,status:"stressed"},
  {id:"Z004",name:"Jayanagar",city:"Bangalore",traffic_level:"low",avg_delivery_minutes:10,active_orders:12,available_riders:5,status:"normal"},
  {id:"Z005",name:"HSR Layout",city:"Bangalore",traffic_level:"high",avg_delivery_minutes:25,active_orders:50,available_riders:2,status:"critical"},
  {id:"Z006",name:"Marathahalli",city:"Bangalore",traffic_level:"medium",avg_delivery_minutes:14,active_orders:22,available_riders:3,status:"normal"}
];

export async function POST() {
  try {
    console.log("[SIMULATION] Resetting system to default state...");
    
    // 1. Clear everything
    await db.delete(trackingEvents);
    await db.delete(bookings);
    await db.delete(predictions);
    await db.delete(routeHistories);
    await db.delete(alerts);
    await db.delete(packages);
    await db.delete(hubs);
    await db.delete(trucks);
    await db.delete(riders);
    await db.delete(zones);

    // 2. Re-insert core data
    await db.insert(trucks).values(TRUCKS);
    await db.insert(hubs).values(HUBS);
    await db.insert(packages).values(PACKAGES);
    await db.insert(riders).values(RIDERS);
    await db.insert(zones).values(ZONES);

    return NextResponse.json({ 
      success: true, 
      message: "System reset to baseline state successfully." 
    });
  } catch (e: any) {
    console.error("[RESET ERROR]", e);
    return NextResponse.json({ 
      success: false, 
      error: e.message 
    }, { status: 500 });
  }
}
