'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { categories } from '@/app/components/navbar/Categories';
import { SafeListing, SafeReservation, SafeUser } from '@/app/types';
import React from 'react';
import ListingHead from '@/app/api/listings/ListingHead';
import ListingInfo from '@/app/components/listings/ListingInfo';
import useLoginModal from '@/app/hooks/useLoginModal';
import { useRouter } from 'next/navigation';
import { differenceInCalendarDays, eachDayOfInterval } from 'date-fns';
import ListingReservation from '@/app/components/listings/ListingReservation';
import { Range } from 'react-date-range';
import axios from 'axios';
import toast from 'react-hot-toast';

const initialDateRange = {
  startDate: new Date(),
  endDate: new Date(),
  key: 'selection',
};

const initialTimeRange = {
  startTime: '',
  endTime: '',
};

interface ListingClientProps {
  reservations?: SafeReservation[];  // Changed from SafeReservation to SafeRent
  listing: SafeListing & {
    user: SafeUser;
  };
  currentUser?: SafeUser | null;
}

const ListingClient: React.FC<ListingClientProps> = ({
  listing,
  reservations = [],
  currentUser,
}) => {
  const loginModal = useLoginModal();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [totalPrice, setTotalPrice] = useState(listing.price);
  const [dateRange, setDateRange] = useState<Range>(initialDateRange);
  const [timeRange, setTimeRange] = useState(initialTimeRange);
  const [bookingType, setBookingType] = useState<string>('daily'); // ✅ Move this up as well
  
  
  // Calculate disabled dates from existing reservations
  const disabledDates = useMemo(() => {
    let dates: Date[] = [];

    reservations.forEach((reservation: any) => {
      const range = eachDayOfInterval({
        start: new Date(reservation.startDate),
        end: new Date(reservation.endDate),
      });
      dates = [...dates, ...range];
    });
    return dates;
  }, [reservations]);
  
  // Calculate disabled time slots for the selected date
  const disabledTimeSlots = useMemo(() => {
    if (!dateRange.startDate) return [];
    
    const selectedDateStr = dateRange.startDate.toISOString().split('T')[0];
    const slotsForSelectedDate: { startTime: string; endTime: string }[] = [];
    
    // Filter reservations for the selected date
    reservations
      .filter(reservation => {
        const reservationDate = new Date(reservation.startDate).toISOString().split('T')[0];
        return reservationDate === selectedDateStr && reservation.bookingType === 'hourly';
      })
      .forEach(reservation => {
        // Add the reservation time slot
        if (reservation.startTime && reservation.endTime) {
          slotsForSelectedDate.push({
            startTime: reservation.startTime,
            endTime: reservation.endTime
          });
          
          // Add the 1-hour cleaning slot after the reservation
          const endHour = parseInt(reservation.endTime.split(':')[0]);
          const cleaningStartTime = reservation.endTime;
          const cleaningEndTime = `${(endHour + 1).toString().padStart(2, '0')}:00`;
          
          slotsForSelectedDate.push({
            startTime: cleaningStartTime,
            endTime: cleaningEndTime
          });
        }
      });
    
    return slotsForSelectedDate;
  }, [reservations, dateRange.startDate]);

  // const [isLoading, setIsLoading] = useState(false);
  // const [totalPrice, setTotalPrice] = useState(listing.price);
  // const [dateRange, setDateRange] = useState<Range>(initialDateRange);
  // const [timeRange, setTimeRange] = useState(initialTimeRange);
  
  // Calculate hourly price
  const hourlyPrice = useMemo(() => {
    // Available hours (10 AM to 10 PM = 13 hours)
    const totalAvailableHours = 13;
    // Minus the cleaning time slots (approx 1 hour per booking)
    const effectiveAvailableHours = 11;
    
    // Calculate hourly rate
    return Math.round(listing.price / effectiveAvailableHours);
  }, [listing.price]);

  const onCreateReservation = useCallback(() => {
    if (!currentUser) {
      return loginModal.onOpen();
    }
    
    // Add validation for hourly bookings
  if (bookingType === 'hourly' && (!timeRange.startTime || !timeRange.endTime)) {
    return toast.error('Please select both start and end times');
  }

    setIsLoading(true);
    
    // Prepare the reservation data based on booking type
    const reservationData = {
      totalPrice,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      listingId: listing?.id,
      bookingType,
      ...(bookingType === 'hourly' ? {
        startTime: timeRange.startTime,
        endTime: timeRange.endTime
      } : {})
    };
    console.log("Sending reservation data:", reservationData);
  
    axios
      .post('/api/reservations', reservationData)
      .then(() => {
        toast.success('Listing reserved!');
        setDateRange(initialDateRange);
        if (bookingType === 'hourly') {
          setTimeRange(initialTimeRange);
        }
        router.push('/trips');
    

      })
      .catch((error) => {
        console.error("Reservation error:", error);
        const errorMessage = error.response?.data?.error || 'Something went wrong';
        toast.error(errorMessage);
      })
      
      .finally(() => {
        setIsLoading(false);
      });
    console.log("Sending reservation data:", reservationData);

  }, [
    totalPrice, 
    dateRange, 
    listing?.id, 
    router, 
    currentUser, 
    loginModal, 
    bookingType, 
    timeRange
  ]);
  // Update total price when date range or time range changes
  useEffect(() => {
    if (bookingType === 'daily') {
      // Daily booking price calculation (existing logic)
      if (dateRange.startDate && dateRange.endDate) {
        const dayCount = differenceInCalendarDays(
          dateRange.endDate,
          dateRange.startDate
        );

        if (dayCount && listing.price) {
          setTotalPrice(dayCount * listing.price);
        } else {
          setTotalPrice(listing.price);
        }
      }
    } else {
      // Hourly booking price calculation
      if (timeRange.startTime && timeRange.endTime) {
        const startHour = parseInt(timeRange.startTime.split(':')[0]);
        const endHour = parseInt(timeRange.endTime.split(':')[0]);
        const hourCount = endHour - startHour;
        
        if (hourCount && hourlyPrice) {
          setTotalPrice(hourCount * hourlyPrice);
        } else {
          setTotalPrice(hourlyPrice || 0);
        }
      } else {
        setTotalPrice(0);
      }
    }
  }, [dateRange, listing.price, bookingType, timeRange, hourlyPrice]);

  // Get category
  const category = useMemo(() => {
    return categories.find((item) => item.label === listing.category);
  }, [listing.category]);

  return (
    <div className="max-w-screen-lg mx-auto">
      <div className="flex flex-col gap-6">
        <ListingHead
          title={listing.title}
          imageSrc={listing.imageSrc}
          locationValue={listing.locationValue}
          id={listing.id}
          currentUser={currentUser}
        />
        <div className="grid grid-col-1 md:grid-cols-7 md:gap-10 mt-6">
          <ListingInfo
            user={listing.user}
            category={category}
            description={listing.description}
            roomCount={listing.roomCount}
            guestCount={listing.guestCount}
            bathroomCount={listing.bathroomCount}
            locationValue={listing.locationValue}
          />
          <div className="order-first mb-10 md:order-last md:col-span-3">
            <ListingReservation
              price={listing.price}
              totalPrice={totalPrice}
              onChangeDate={(value) => setDateRange(value)}
              dateRange={dateRange}
              onSubmit={onCreateReservation}
              disabled={isLoading}
              disabledDates={disabledDates}
              // Hourly booking props
              bookingType={bookingType}
              onChangeBookingType={setBookingType}
              hourlyPrice={hourlyPrice}
              timeRange={timeRange}
              onChangeTimeRange={setTimeRange}
              disabledTimeSlots={disabledTimeSlots}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingClient;

