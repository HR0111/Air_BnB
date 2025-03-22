import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/getCurrentUser";

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.error();
  }

  const body = await request.json();
  const {
    listingId,
    startDate,
    endDate,
    totalPrice,
    bookingType = 'daily',
    startTime,
    endTime
  } = body;

  if (!listingId || !startDate || !totalPrice) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // For hourly bookings, we need both startTime and endTime
  if (bookingType === 'hourly' && (!startTime || !endTime)) {
    return NextResponse.json(
      { error: "Start time and end time are required for hourly bookings" },
      { status: 400 }
    );
  }

  try {
    // Verify that this is a valid reservation (no overlaps)
    if (bookingType === 'hourly') {
      const selectedDate = new Date(startDate);
      const selectedDateStr = selectedDate.toISOString().split('T')[0];
      
      // Check for overlapping hourly reservations
      const existingReservations = await prisma.reservation.findMany({
        where: {
          listingId,
          bookingType: 'hourly',
          startDate: {
            gte: new Date(selectedDateStr),
            lt: new Date(new Date(selectedDateStr).setDate(selectedDate.getDate() + 1))
          }
        }
      });
      
      // Check if there's an overlap with existing reservations
      const startHour = parseInt(startTime.split(':')[0]);
      const endHour = parseInt(endTime.split(':')[0]);
      
      const hasOverlap = existingReservations.some(reservation => {
        if (!reservation.startTime || !reservation.endTime) return false;
        
        const reservationStartHour = parseInt(reservation.startTime.split(':')[0]);
        const reservationEndHour = parseInt(reservation.endTime.split(':')[0]);
        
        // Check if the time ranges overlap
        // Also consider the 1-hour cleaning gap
        return (
          (startHour >= reservationStartHour && startHour < reservationEndHour + 1) || 
          (endHour > reservationStartHour - 1 && endHour <= reservationEndHour + 1) ||
          (startHour <= reservationStartHour - 1 && endHour >= reservationEndHour + 1)
        );
      });
      
      if (hasOverlap) {
        return NextResponse.json(
          { error: "Time slot not available or conflicts with cleaning time" },
          { status: 400 }
        );
      }
      
      // Check if booking duration is at least 3 hours
      if (endHour - startHour < 3) {
        return NextResponse.json(
          { error: "Minimum booking duration is 3 hours" },
          { status: 400 }
        );
      }
      
      // Check if booking end time is before 11 PM
      if (endHour > 23) {
        return NextResponse.json(
          { error: "Bookings must end by 11 PM" },
          { status: 400 }
        );
      }
    } else {
      // For daily bookings, check for date overlaps
      const existingReservations = await prisma.reservation.findMany({
        where: {
          listingId,
          OR: [
            {
              startDate: { lte: new Date(endDate) },
              endDate: { gte: new Date(startDate) }
            }
          ]
        }
      });

      if (existingReservations.length > 0) {
        return NextResponse.json(
          { error: "Dates not available" },
          { status: 400 }
        );
      }
    }

    // Create the reservation
    const listingAndReservation = await prisma.listing.update({
      where: {
        id: listingId
      },
      data: {
        reservations: {
          create: {
            userId: currentUser.id,
            startDate: new Date(startDate),
            endDate: new Date(endDate || startDate),
            totalPrice,
            bookingType,
            startTime: bookingType === 'hourly' ? startTime : null,
            endTime: bookingType === 'hourly' ? endTime : null
          }
        }
      }
    });

    return NextResponse.json(listingAndReservation);
  } catch (error) {
    console.error("Reservation error:", error);
    return NextResponse.json(
      { error: "Failed to create reservation" },
      { status: 500 }
    );
  }
}