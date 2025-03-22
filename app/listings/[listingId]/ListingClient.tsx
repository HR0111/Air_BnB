'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { categories } from '@/app/components/navbar/Categories';
import { SafeListing, SafeReservation, SafeUser } from '@/app/types';
import React from 'react';
import ListingHead from '@/app/api/listings/ListingHead';
import ListingInfo from '@/app/components/listings/ListingInfo';
import useLoginModal from '@/app/hooks/useLoginModal';
import { useRouter } from 'next/navigation';
import { differenceInCalendarDays, eachDayOfInterval, parse, format } from 'date-fns';
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
  reservations?: SafeReservation[];
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
  useEffect(() => {
    console.log("Listing object:", listing);
    console.log("Listing ID:", listing?.id);
  }, [listing]);

  const loginModal = useLoginModal();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [totalPrice, setTotalPrice] = useState(listing.price);
  const [dateRange, setDateRange] = useState<Range>(initialDateRange);
  const [timeRange, setTimeRange] = useState(initialTimeRange);
  const [bookingType, setBookingType] = useState<string>('daily');
  const [bookingError, setBookingError] = useState<string | null>(null);
  
  // Calculate hourly price: (daily price / 24) * 1.5
  const hourlyPrice = useMemo(() => {
    const calculatedPrice = Math.round((listing.price / 24) * 1.5);
    // Ensure it's at least 1
    return Math.max(1, calculatedPrice);
  }, [listing.price]);

  // Calculate minimum booking hours (3 hours)
  const minBookingHours = 3;
  
  // Calculate the cut-off time for hourly bookings (10 PM)
  const lateCutoffHour = 22; // 10 PM
  
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

  // Validate time selection based on rules
  const validateTimeSelection = useCallback(() => {
    if (!timeRange.startTime || !timeRange.endTime) return null;
    
    const startHour = parseInt(timeRange.startTime.split(':')[0]);
    const endHour = parseInt(timeRange.endTime.split(':')[0]);
    const hourCount = endHour - startHour;
    
    // Rule 2: Minimum 3 hours booking
    if (hourCount < minBookingHours) {
      return `Minimum booking time is ${minBookingHours} hours`;
    }
    
    // Rule 3: If booking is more than 8 hours, suggest daily booking
    if (hourCount > 8) {
      return 'For bookings longer than 8 hours, please consider a daily booking';
    }
    
    // Rule 4: No bookings past 10 PM
    if (endHour > lateCutoffHour) {
      return 'Hourly bookings cannot extend past 10 PM';
    }
    
    return null;
  }, [timeRange, minBookingHours]);

  // Update error message when time range changes
  useEffect(() => {
    if (bookingType === 'hourly') {
      const error = validateTimeSelection();
      setBookingError(error);
    } else {
      setBookingError(null);
    }
  }, [timeRange, bookingType, validateTimeSelection]);

  const onCreateReservation = useCallback(() => {
    if (!currentUser) {
      return loginModal.onOpen();
    }

    if (!listing || !listing.id) {
      toast.error('Listing information is missing');
      setIsLoading(false);
      return;
    }
    
    if (totalPrice <= 0) {
      toast.error('Invalid price calculation');
      setIsLoading(false);
      return;
    }
    
    if (!dateRange.startDate) {
      toast.error('Start date is missing');
      setIsLoading(false);
      return;
    }
    
    // Validate hourly bookings
    if (bookingType === 'hourly') {
      if (!timeRange.startTime || !timeRange.endTime) {
        toast.error('Please select both start and end times');
        setIsLoading(false);
        return;
      }
      
      // Check if the booking meets our criteria
      const error = validateTimeSelection();
      if (error) {
        toast.error(error);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    
    // Make sure we have valid date objects
    if (!dateRange.startDate || !(dateRange.startDate instanceof Date)) {
      console.error("Invalid start date");
      toast.error('Please select a valid date');
      setIsLoading(false);
      return;
    }
    
    // Calculate final price based on all rules
    let finalPrice = totalPrice;
    const days = dateRange.endDate && differenceInCalendarDays(dateRange.endDate, dateRange.startDate);
    
    // Rule 3: Multi-day booking with 10% premium
    if (days && days > 1) {
      finalPrice = listing.price * days * 1.1; // Add 10% premium for multi-day bookings
    }
    
    // Prepare the reservation data
    const reservationData = {
      totalPrice: finalPrice,
      startDate: dateRange.startDate.toISOString(),
      endDate: dateRange.endDate ? dateRange.endDate.toISOString() : dateRange.startDate.toISOString(),
      listingId: listing.id,
      bookingType,
      ...(bookingType === 'hourly' ? {
        startTime: timeRange.startTime,
        endTime: timeRange.endTime
      } : {})
    };

    console.log("Reservation data being sent:", JSON.stringify(reservationData));

    // Check all required fields are present
    if (!reservationData.listingId || !reservationData.startDate || !reservationData.totalPrice) {
      toast.error('Missing required reservation data');
      console.error("Missing fields:", {
        listingId: !reservationData.listingId,
        startDate: !reservationData.startDate,
        totalPrice: !reservationData.totalPrice
      });
      setIsLoading(false);
      return;
    }

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
        console.error("Response data:", error.response?.data);
        const errorMessage = error.response?.data?.error || 'Something went wrong';
        toast.error(errorMessage);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [
    totalPrice, 
    dateRange, 
    listing?.id, 
    listing.price,
    router, 
    currentUser, 
    loginModal, 
    bookingType, 
    timeRange,
    validateTimeSelection
  ]);

  // Update total price when date range or time range changes
  useEffect(() => {
    if (bookingType === 'daily') {
      // Daily booking price calculation
      if (dateRange.startDate && dateRange.endDate) {
        const dayCount = differenceInCalendarDays(
          dateRange.endDate,
          dateRange.startDate
        );

        if (dayCount && listing.price) {
          // Rule 3: Add 10% premium for multi-day bookings
          const premium = dayCount > 1 ? 1.1 : 1;
          setTotalPrice(Math.round(dayCount * listing.price * premium));
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
        
        // Rule 3: If booking exceeds 8 hours, use daily rate
        if (hourCount > 8) {
          setTotalPrice(listing.price);
        } else if (hourCount && hourlyPrice) {
          // Regular hourly rate
          setTotalPrice(hourCount * hourlyPrice);
        } else {
          setTotalPrice(0);
        }
        
        // Rule 4: If booking extends past 10 PM, use full day rate
        if (endHour > lateCutoffHour) {
          setTotalPrice(listing.price);
        }
      } else {
        setTotalPrice(0);
      }
    }
  }, [dateRange, listing.price, bookingType, timeRange, hourlyPrice, lateCutoffHour]);

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
              disabled={isLoading || !!bookingError}
              disabledDates={disabledDates}
              // Hourly booking props
              bookingType={bookingType}
              onChangeBookingType={setBookingType}
              hourlyPrice={hourlyPrice}
              timeRange={timeRange}
              onChangeTimeRange={setTimeRange}
              disabledTimeSlots={disabledTimeSlots}
              bookingError={bookingError}
              minBookingHours={minBookingHours}
              maxHourlyBookingHours={8}
              lateCutoffHour={lateCutoffHour}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingClient;






// 'use client';

// import { useCallback, useEffect, useMemo, useState } from 'react';
// import { categories } from '@/app/components/navbar/Categories';
// import { SafeListing, SafeReservation, SafeUser } from '@/app/types';
// import React from 'react';
// import ListingHead from '@/app/api/listings/ListingHead';
// import ListingInfo from '@/app/components/listings/ListingInfo';
// import useLoginModal from '@/app/hooks/useLoginModal';
// import { useRouter } from 'next/navigation';
// import { differenceInCalendarDays, eachDayOfInterval } from 'date-fns';
// import ListingReservation from '@/app/components/listings/ListingReservation';
// import { Range } from 'react-date-range';
// import axios from 'axios';
// import toast from 'react-hot-toast';

// const initialDateRange = {
//   startDate: new Date(),
//   endDate: new Date(),
//   key: 'selection',
// };

// const initialTimeRange = {
//   startTime: '',
//   endTime: '',
// };

// interface ListingClientProps {
//   reservations?: SafeReservation[];  // Changed from SafeReservation to SafeRent
//   listing: SafeListing & {
//     user: SafeUser;
//   };
//   currentUser?: SafeUser | null;
// }

// const ListingClient: React.FC<ListingClientProps> = ({
//   listing,
//   reservations = [],
//   currentUser,
// }) => {

//   useEffect(() => {
//     console.log("Listing object:", listing);
//     console.log("Listing ID:", listing?.id);
//   }, [listing]);

//   const loginModal = useLoginModal();
//   const router = useRouter();
//   const [isLoading, setIsLoading] = useState(false);
//   const [totalPrice, setTotalPrice] = useState(listing.price);
//   const [dateRange, setDateRange] = useState<Range>(initialDateRange);
//   const [timeRange, setTimeRange] = useState(initialTimeRange);
//   const [bookingType, setBookingType] = useState<string>('daily'); // ✅ Move this up as well
  
  
//   // Calculate disabled dates from existing reservations
//   const disabledDates = useMemo(() => {
//     let dates: Date[] = [];

//     reservations.forEach((reservation: any) => {
//       const range = eachDayOfInterval({
//         start: new Date(reservation.startDate),
//         end: new Date(reservation.endDate),
//       });
//       dates = [...dates, ...range];
//     });
//     return dates;
//   }, [reservations]);
  
//   // Calculate disabled time slots for the selected date
//   const disabledTimeSlots = useMemo(() => {
//     if (!dateRange.startDate) return [];
    
//     const selectedDateStr = dateRange.startDate.toISOString().split('T')[0];
//     const slotsForSelectedDate: { startTime: string; endTime: string }[] = [];
    
//     // Filter reservations for the selected date
//     reservations
//       .filter(reservation => {
//         const reservationDate = new Date(reservation.startDate).toISOString().split('T')[0];
//         return reservationDate === selectedDateStr && reservation.bookingType === 'hourly';
//       })
//       .forEach(reservation => {
//         // Add the reservation time slot
//         if (reservation.startTime && reservation.endTime) {
//           slotsForSelectedDate.push({
//             startTime: reservation.startTime,
//             endTime: reservation.endTime
//           });
          
//           // Add the 1-hour cleaning slot after the reservation
//           const endHour = parseInt(reservation.endTime.split(':')[0]);
//           const cleaningStartTime = reservation.endTime;
//           const cleaningEndTime = `${(endHour + 1).toString().padStart(2, '0')}:00`;
          
//           slotsForSelectedDate.push({
//             startTime: cleaningStartTime,
//             endTime: cleaningEndTime
//           });
//         }
//       });
    
//     return slotsForSelectedDate;
//   }, [reservations, dateRange.startDate]);

//   // const [isLoading, setIsLoading] = useState(false);
//   // const [totalPrice, setTotalPrice] = useState(listing.price);
//   // const [dateRange, setDateRange] = useState<Range>(initialDateRange);
//   // const [timeRange, setTimeRange] = useState(initialTimeRange);
  
//   // Calculate hourly price
//   const hourlyPrice = useMemo(() => {
//     // Available hours (10 AM to 10 PM = 13 hours)
//     const totalAvailableHours = 13;
//     // Minus the cleaning time slots (approx 1 hour per booking)
//     const effectiveAvailableHours = 11;
    
//     // Calculate hourly rate (ensure it's at least 1)
//     return Math.max(1, Math.round(listing.price / effectiveAvailableHours));
//   }, [listing.price]);

//   const onCreateReservation = useCallback(() => {

//     if (!currentUser) {
//       return loginModal.onOpen();
//     }

//     if (!listing || !listing.id) {
//       toast.error('Listing information is missing');
//       setIsLoading(false);
//       return;
//     }
//     if (totalPrice <= 0) {
//       toast.error('Invalid price calculation');
//       setIsLoading(false);
//       return;
//     }
    
    
    
//     if (!dateRange.startDate) {
//       toast.error('Start date is missing');
//       setIsLoading(false);
//       return;
//     }
    
//     // Add validation for hourly bookings
//   if (bookingType === 'hourly' && (!timeRange.startTime || !timeRange.endTime)) {
//     return toast.error('Please select both start and end times');
//   }

//     setIsLoading(true);
//     console.log("Current dateRange:", dateRange);
//     console.log("Start date valid?", dateRange.startDate instanceof Date);
//     console.log("End date valid?", dateRange.endDate instanceof Date);

//     // Make sure we have valid date objects
//   if (!dateRange.startDate || !(dateRange.startDate instanceof Date)) {
//     console.error("Invalid start date");
//     toast.error('Please select a valid date');
//     setIsLoading(false);
//     return;
//   }
  
//   // For hourly bookings, set endDate equal to startDate if not already set
//   // let formattedEndDate;
//   // if (bookingType === 'hourly') {
//   //   formattedEndDate = dateRange.startDate.toISOString();
//   // } else {
//   //   formattedEndDate = dateRange.endDate instanceof Date 
//   //     ? dateRange.endDate.toISOString()
//   //     : dateRange.startDate.toISOString();
//   // }
//   // For hourly bookings
// if (timeRange.startTime && timeRange.endTime) {
//   const startHour = parseInt(timeRange.startTime.split(':')[0]);
//   const endHour = parseInt(timeRange.endTime.split(':')[0]);
//   const hourCount = endHour - startHour;
  
//   if (hourCount && hourlyPrice) {
//     setTotalPrice(hourCount * hourlyPrice);
//   } else {
//     setTotalPrice(hourlyPrice || listing.price); // Fallback to listing price if hourlyPrice is 0
//   }
// } else {
//   setTotalPrice(hourlyPrice || listing.price); // Fallback to listing price if hourly calculation fails
// }
     
//   // Prepare the reservation data
//   const reservationData = {
//     totalPrice,
//     startDate: dateRange.startDate.toISOString(),
//     endDate: dateRange.endDate?.toISOString(),
//     listingId: listing.id,
//     bookingType,
//     ...(bookingType === 'hourly' ? {
//       startTime: timeRange.startTime,
//       endTime: timeRange.endTime
//     } : {})
//   };

//     console.log("Reservation data being sent:", JSON.stringify(reservationData));

//      // Check all required fields are present
//   if (!reservationData.listingId || !reservationData.startDate || !reservationData.totalPrice) {
//     toast.error('Missing required reservation data');
//     console.error("Missing fields:", {
//       listingId: !reservationData.listingId,
//       startDate: !reservationData.startDate,
//       totalPrice: !reservationData.totalPrice
//     });
//     setIsLoading(false);
//     return;
//   }

//     axios
//       .post('/api/reservations', reservationData)
//       .then(() => {
//         toast.success('Listing reserved!');
//         setDateRange(initialDateRange);
//         if (bookingType === 'hourly') {
//           setTimeRange(initialTimeRange);
//         }
//         router.push('/trips');
    

//       })
//       .catch((error) => {
//         console.error("Reservation error:", error);
//         console.error("Response data:", error.response?.data);
//         const errorMessage = error.response?.data?.error || 'Something went wrong';
//         toast.error(errorMessage);
//       })
//       .finally(() => {
//         setIsLoading(false);
//       });
    

//   }, [
//     totalPrice, 
//     dateRange, 
//     listing?.id, 
//     router, 
//     currentUser, 
//     loginModal, 
//     bookingType, 
//     timeRange
//   ]);
//   // Update total price when date range or time range changes
//   useEffect(() => {
//     if (bookingType === 'daily') {
//       // Daily booking price calculation (existing logic)
//       if (dateRange.startDate && dateRange.endDate) {
//         const dayCount = differenceInCalendarDays(
//           dateRange.endDate,
//           dateRange.startDate
//         );

//         if (dayCount && listing.price) {
//           setTotalPrice(dayCount * listing.price);
//         } else {
//           setTotalPrice(listing.price);
//         }
//       }
//     } else {
//       // Hourly booking price calculation
//       if (timeRange.startTime && timeRange.endTime) {
//         const startHour = parseInt(timeRange.startTime.split(':')[0]);
//         const endHour = parseInt(timeRange.endTime.split(':')[0]);
//         const hourCount = endHour - startHour;
        
//         if (hourCount && hourlyPrice) {
//           setTotalPrice(hourCount * hourlyPrice);
//         } else {
//           setTotalPrice(hourlyPrice || 0);
//         }
//       } else {
//         setTotalPrice(0);
//       }
//     }
//   }, [dateRange, listing.price, bookingType, timeRange, hourlyPrice]);

//   // Get category
//   const category = useMemo(() => {
//     return categories.find((item) => item.label === listing.category);
//   }, [listing.category]);

//   return (
//     <div className="max-w-screen-lg mx-auto">
//       <div className="flex flex-col gap-6">
//         <ListingHead
//           title={listing.title}
//           imageSrc={listing.imageSrc}
//           locationValue={listing.locationValue}
//           id={listing.id}
//           currentUser={currentUser}
//         />
//         <div className="grid grid-col-1 md:grid-cols-7 md:gap-10 mt-6">
//           <ListingInfo
//             user={listing.user}
//             category={category}
//             description={listing.description}
//             roomCount={listing.roomCount}
//             guestCount={listing.guestCount}
//             bathroomCount={listing.bathroomCount}
//             locationValue={listing.locationValue}
//           />
//           <div className="order-first mb-10 md:order-last md:col-span-3">
//             <ListingReservation
//               price={listing.price}
//               totalPrice={totalPrice}
//               onChangeDate={(value) => setDateRange(value)}
//               dateRange={dateRange}
//               onSubmit={onCreateReservation}
//               disabled={isLoading}
//               disabledDates={disabledDates}
//               // Hourly booking props
//               bookingType={bookingType}
//               onChangeBookingType={setBookingType}
//               hourlyPrice={hourlyPrice}
//               timeRange={timeRange}
//               onChangeTimeRange={setTimeRange}
//               disabledTimeSlots={disabledTimeSlots}
//             />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ListingClient;

