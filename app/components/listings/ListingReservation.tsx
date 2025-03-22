
'use client';

import React, { useMemo } from 'react';
import { Range } from 'react-date-range';
import Button from '../Button';
import Calendar from '../inputs/Calendar';
import TimeRangePicker from '../inputs/TimeRangePicker';

interface ListingReservationProps {
  price: number;
  dateRange: Range;
  totalPrice: number;
  onChangeDate: (value: Range) => void;
  onSubmit: () => void;
  disabled?: boolean;
  disabledDates: Date[];
  // New props for hourly booking
  bookingType: string;
  onChangeBookingType: (value: string) => void;
  hourlyPrice?: number;
  timeRange: { startTime: string; endTime: string };
  onChangeTimeRange: (value: { startTime: string; endTime: string }) => void;
  disabledTimeSlots: { startTime: string; endTime: string }[];
  // New props for pricing rules
  bookingError?: string | null;
  minBookingHours?: number;
  maxHourlyBookingHours?: number;
  lateCutoffHour?: number;
}

const ListingReservation: React.FC<ListingReservationProps> = ({
  price,
  dateRange,
  totalPrice,
  onChangeDate,
  onSubmit,
  disabled,
  disabledDates,
  // Hourly booking props
  bookingType = 'daily',
  onChangeBookingType,
  hourlyPrice,
  timeRange,
  onChangeTimeRange,
  disabledTimeSlots = [],
  // Pricing rule props
  bookingError,
  minBookingHours = 3,
  maxHourlyBookingHours = 8,
  lateCutoffHour = 22
}) => {
  // Calculate price display for headline
  const displayPrice = bookingType === 'hourly' ? hourlyPrice : price;
  const displayUnit = bookingType === 'hourly' ? 'hour' : 'night';
  
  // Prepare pricing rules info for display
  const pricingRules = useMemo(() => {
    if (bookingType === 'hourly') {
      return [
        `Minimum booking: ${minBookingHours} hours`,
        `Bookings over ${maxHourlyBookingHours} hours will convert to daily rate`,
        `No bookings available past ${lateCutoffHour}:00`,
        `Multi-day bookings include a 10% premium`
      ];
    }
    return [];
  }, [bookingType, minBookingHours, maxHourlyBookingHours, lateCutoffHour]);

  return (
    <div className="bg-white rounded-xl border-[1px] border-neutral-200 overflow-hidden">
      <div className='flex flex-row items-center gap-1 p-4'>
        <div className='text-2xl font-semibold'>
          ${displayPrice}
        </div>
        <div className="font-light text-neutral-600">
          /{displayUnit}
        </div>
      </div>
      <hr />
      
      {/* Booking Type Selector */}
      <div className="p-4">
        <div className="flex rounded-md overflow-hidden mb-4">
          <button
            onClick={() => onChangeBookingType('daily')}
            className={`flex-1 py-2 text-center ${
              bookingType === 'daily'
                ? 'bg-rose-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Daily Booking
          </button>
          <button
            onClick={() => onChangeBookingType('hourly')}
            className={`flex-1 py-2 text-center ${
              bookingType === 'hourly'
                ? 'bg-rose-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Hourly Booking
          </button>
        </div>
        
        {/* Pricing Rules Info (only for hourly) */}
        {bookingType === 'hourly' && (
          <div className="text-sm text-neutral-600 mb-3 bg-gray-50 p-3 rounded-md">
            <p className="font-medium mb-1">Booking Rules:</p>
            <ul className="list-disc pl-5 space-y-1">
              {pricingRules.map((rule, index) => (
                <li key={index}>{rule}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* Date Selection (for both daily and hourly) */}
      <div className="p-4">
        <Calendar
          value={dateRange}
          disabledDates={disabledDates}
          onChange={(value) => onChangeDate(value.selection)}
        />
      </div>
      
      {/* Time Selection (only for hourly bookings) */}
      {bookingType === 'hourly' && (
        <div className="p-4">
          <TimeRangePicker
            value={timeRange}
            onChange={onChangeTimeRange}
            disabledTimeSlots={disabledTimeSlots}
            minDuration={minBookingHours}
            maxTime={`${lateCutoffHour}:00`}
          />
          
          {/* Error Message */}
          {bookingError && (
            <div className="text-rose-500 text-sm mt-2">
              {bookingError}
            </div>
          )}
        </div>
      )}
      
      <hr />
      <div className='p-4'>
        <Button
          disabled={
            disabled || 
            (bookingType === 'hourly' && (!timeRange.startTime || !timeRange.endTime)) ||
            !!bookingError
          }
          label="Reserve"
          onClick={onSubmit}
        />
      </div>
      
      <div className='p-4 flex flex-row items-center justify-between font-semibold text-lg'>
        <div>
          Total
        </div>
        <div>
          ${totalPrice}
        </div>
      </div>
    </div>
  );
};

export default ListingReservation;




// 'use client';

// import React, { useState } from 'react';
// import { Range } from 'react-date-range';
// import Button from '../Button';
// import Calendar from '../inputs/Calendar';
// import TimeRangePicker from '../inputs/TimeRangePicker';

// interface ListingReservationProps {
//   price: number;
//   dateRange: Range;
//   totalPrice: number;
//   onChangeDate: (value: Range) => void;
//   onSubmit: () => void;
//   disabled?: boolean;
//   disabledDates: Date[];
//   // New props for hourly booking
//   bookingType: string;
//   onChangeBookingType: (value: string) => void;
//   hourlyPrice?: number;
//   timeRange: { startTime: string; endTime: string };
//   onChangeTimeRange: (value: { startTime: string; endTime: string }) => void;
//   disabledTimeSlots: { startTime: string; endTime: string }[];
// }

// const ListingReservation: React.FC<ListingReservationProps> = ({
//   price,
//   dateRange,
//   totalPrice,
//   onChangeDate,
//   onSubmit,
//   disabled,
//   disabledDates,
//   // Hourly booking props
//   bookingType = 'daily',
//   onChangeBookingType,
//   hourlyPrice,
//   timeRange,
//   onChangeTimeRange,
//   disabledTimeSlots = []
// }) => {
//   return (
//     <div className="bg-white rounded-xl border-[1px] border-neutral-200 overflow-hidden">
//       <div className='flex flex-row items-center gap-1 p-4'>
//         <div className='text-2xl font-semibold'>
//           ${bookingType === 'hourly' ? hourlyPrice : price}
//         </div>
//         <div className="font-light text-neutral-600">
//           {bookingType === 'hourly' ? 'hour' : 'night'}
//         </div>
//       </div>
//       <hr />
      
//       {/* Booking Type Selector */}
//       <div className="p-4">
//         <div className="flex rounded-md overflow-hidden mb-4">
//           <button
//             onClick={() => onChangeBookingType('daily')}
//             className={`flex-1 py-2 text-center ${
//               bookingType === 'daily'
//                 ? 'bg-rose-500 text-white'
//                 : 'bg-gray-200 text-gray-700'
//             }`}
//           >
//             Daily Booking
//           </button>
//           <button
//             onClick={() => onChangeBookingType('hourly')}
//             className={`flex-1 py-2 text-center ${
//               bookingType === 'hourly'
//                 ? 'bg-rose-500 text-white'
//                 : 'bg-gray-200 text-gray-700'
//             }`}
//           >
//             Hourly Booking
//           </button>
//         </div>
//       </div>
      
//       {/* Date Selection (for both daily and hourly) */}
//       <div className="p-4">
//         <Calendar
//           value={dateRange}
//           disabledDates={disabledDates}
//           onChange={(value) => onChangeDate(value.selection)}
//         />
//       </div>
      
//       {/* Time Selection (only for hourly bookings) */}
//       {bookingType === 'hourly' && (
//         <div className="p-4">
//           <TimeRangePicker
//             value={timeRange}
//             onChange={onChangeTimeRange}
//             disabledTimeSlots={disabledTimeSlots}
//             minDuration={3}
//             maxTime="23:00"
//           />
//         </div>
//       )}
      
//       <hr />
//       <div className='p-4'>
//         <Button
//           disabled={disabled || (bookingType === 'hourly' && (!timeRange.startTime || !timeRange.endTime))}
//           label="Reserve"
//           onClick={onSubmit}
//         />
//       </div>
      
//       <div className='p-4 flex flex-row items-center justify-between font-semibold text-lg'>
//         <div>
//           Total
//         </div>
//         <div>
//           ${totalPrice}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ListingReservation;
