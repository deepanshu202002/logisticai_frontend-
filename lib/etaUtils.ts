import { addDays, format, isAfter, setHours, setMinutes } from "date-fns";

export interface ETAResult {
  days: number;
  arrivalDate: Date;
  formattedArrival: string;
  weatherDelay: boolean;
}

export function calculateETA(
  distanceKm: number,
  priority: "express" | "standard" = "standard",
  routeHubs: any[] = [],
  allHubsData: any[] = [],
  existingDelayMinutes: number = 0
): ETAResult {
  const now = new Date();
  
  // 1. Base transit days: 500km/day
  let days = distanceKm / 500;

  // 2. Add existing delays (converted to days)
  if (existingDelayMinutes > 0) {
    days += existingDelayMinutes / (24 * 60);
  }

  // 2. Priority Modifiers
  if (priority === "express") {
    days *= 0.7; // 30% faster
  }

  // 3. Hub Penalties (Accumulative)
  let weatherDelay = false;
  routeHubs.forEach(hubCity => {
    const hubData = allHubsData.find(h => h.city === hubCity || h.id === hubCity);
    if (hubData) {
      if (hubData.status === "warning") days += 0.2;
      if (hubData.status === "overloaded") days += 0.5;
      if (hubData.status === "storm") {
        days += 1.0;
        weatherDelay = true;
      }
    }
  });

  // 4. Timezone & Cutoff Logic
  const istNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const cutoff = setMinutes(setHours(istNow, 14), 0);
  if (isAfter(istNow, cutoff)) {
    days += 0.5; // Half day penalty for late booking
  }

  // 5. Minimum 0.5 days, round to 1 decimal place for variety
  days = Math.max(0.5, Math.round(days * 10) / 10);

  const arrivalDate = addDays(now, days);

  return {
    days,
    arrivalDate,
    formattedArrival: format(arrivalDate, "EEEE, MMM do"),
    weatherDelay
  };
}
