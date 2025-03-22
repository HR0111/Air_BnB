// 'use client';

// import { useState, useEffect } from 'react';

// interface TimeRangePickerProps {
//   value: { startTime: string; endTime: string };
//   onChange: (value: { startTime: string; endTime: string }) => void;
//   disabledTimeSlots: { startTime: string; endTime: string }[];
//   minDuration: number; // in hours
//   maxTime: string; // format: "HH:MM"
// }

// const TimeRangePicker: React.FC<TimeRangePickerProps> = ({
//   value,
//   onChange,
//   disabledTimeSlots,
//   minDuration = 3,
//   maxTime = "23:00"
// }) => {
//   const [availableStartTimes, setAvailableStartTimes] = useState<string[]>([]);
//   const [availableEndTimes, setAvailableEndTimes] = useState<string[]>([]);
  
//   // Generate time slots in 1-hour increments from 00:00 to 23:00
//   const generateTimeSlots = () => {
//     const slots = [];
//     for (let hour = 0; hour < 24; hour++) {
//       const timeString = `${hour.toString().padStart(2, '0')}:00`;
//       slots.push(timeString);
//     }
//     return slots;
//   };
  
//   const allTimeSlots = generateTimeSlots();
  
//   // Filter available start times based on disabled slots and max time
//   useEffect(() => {
//     const maxTimeHour = parseInt(maxTime.split(':')[0]);
    
//     const filteredStartTimes = allTimeSlots.filter(time => {
//       const hour = parseInt(time.split(':')[0]);
      
//       // Ensure the time isn't past the max allowed time minus minimum duration
//       if (hour > maxTimeHour - minDuration) {
//         return false;
//       }
      
//       // Check if the time slot overlaps with any disabled slots
//       for (const disabledSlot of disabledTimeSlots) {
//         const disabledStart = disabledSlot.startTime;
//         const disabledEnd = disabledSlot.endTime;
        
//         // If the current time is within a disabled slot
//         if (time >= disabledStart && time < disabledEnd) {
//           return false;
//         }
        
//         // If starting at this time would not allow for minimum duration before a disabled slot
//         const currentHour = parseInt(time.split(':')[0]);
//         const disabledStartHour = parseInt(disabledStart.split(':')[0]);
        
//         if (currentHour < disabledStartHour && 
//             disabledStartHour - currentHour < minDuration) {
//           return false;
//         }
//       }
      
//       return true;
//     });
    
//     setAvailableStartTimes(filteredStartTimes);
//   }, [disabledTimeSlots, maxTime, minDuration]);
  
//   // Update available end times when start time changes
//   useEffect(() => {
//     if (!value.startTime) {
//       setAvailableEndTimes([]);
//       return;
//     }
    
//     const startHour = parseInt(value.startTime.split(':')[0]);
//     const maxTimeHour = parseInt(maxTime.split(':')[0]);
    
//     // End time must be at least minDuration hours after start time
//     // and before or equal to maxTime
//     const filteredEndTimes = allTimeSlots.filter(time => {
//       const hour = parseInt(time.split(':')[0]);
      
//       // Must be at least minDuration hours after start time
//       if (hour < startHour + minDuration) {
//         return false;
//       }
      
//       // Must not be after maxTime
//       if (hour > maxTimeHour) {
//         return false;
//       }
      
//       // Check if there's any disabled slot between start time and this end time
//       for (const disabledSlot of disabledTimeSlots) {
//         const disabledStart = disabledSlot.startTime;
//         const disabledStartHour = parseInt(disabledStart.split(':')[0]);
        
//         // If there's a disabled slot that starts after our start time but before this end time
//         if (disabledStartHour > startHour && disabledStartHour < hour) {
//           return false;
//         }
//       }
      
//       return true;
//     });
    
//     setAvailableEndTimes(filteredEndTimes);
    
//     // If current end time is not valid, reset it
//     if (!filteredEndTimes.includes(value.endTime)) {
//       onChange({ ...value, endTime: filteredEndTimes[0] || '' });
//     }
//   }, [value.startTime, disabledTimeSlots, maxTime, minDuration]);
  
//   return (
//     <div className="flex flex-col gap-4">
//       <div className="flex flex-col">
//         <label className="font-medium">Start Time</label>
//         <select
//           value={value.startTime}
//           onChange={(e) => {
//             onChange({ 
//               startTime: e.target.value,
//               endTime: value.endTime
//             });
//           }}
//           className="w-full p-2 border border-gray-300 rounded-md"
//         >
//           <option value="">Select start time</option>
//           {availableStartTimes.map((time) => (
//             <option key={`start-${time}`} value={time}>
//               {time}
//             </option>
//           ))}
//         </select>
//       </div>
      
//       <div className="flex flex-col">
//         <label className="font-medium">End Time</label>
//         <select
//           value={value.endTime}
//           onChange={(e) => {
//             onChange({ 
//               startTime: value.startTime,
//               endTime: e.target.value
//             });
//           }}
//           disabled={!value.startTime}
//           className="w-full p-2 border border-gray-300 rounded-md"
//         >
//           <option value="">Select end time</option>
//           {availableEndTimes.map((time) => (
//             <option key={`end-${time}`} value={time}>
//               {time}
//             </option>
//           ))}
//         </select>
//       </div>
      
//       {value.startTime && value.endTime && (
//         <div className="mt-2">
//           <p className="text-sm text-gray-600">
//             Duration: {parseInt(value.endTime) - parseInt(value.startTime)} hours
//           </p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default TimeRangePicker;

///////////////////////////////////////////////////////////////////////////////////////////////////////////
// correct vala code

// In your TimeRangePicker component
import React from 'react';

interface TimeRangePickerProps {
  value: { startTime: string; endTime: string };
  onChange: (value: { startTime: string; endTime: string }) => void;
  disabledTimeSlots: { startTime: string; endTime: string }[];
  minDuration?: number;
  maxTime?: string;
}

const TimeRangePicker: React.FC<TimeRangePickerProps> = ({
  value,
  onChange,
  disabledTimeSlots,
  minDuration = 1,
  maxTime = "22:00"
}) => {
  // Available time slots from 10:00 to maxTime (22:00 default)
  const availableHours = [];
  for (let i = 10; i <= parseInt(maxTime.split(':')[0]); i++) {
    availableHours.push(`${i.toString().padStart(2, '0')}:00`);
  }

  // Check if a time slot is disabled
  const isTimeSlotDisabled = (time: string) => {
    return disabledTimeSlots.some(slot => {
      const slotStart = slot.startTime;
      const slotEnd = slot.endTime;
      return time >= slotStart && time < slotEnd;
    });
  };

  // Handle start time selection
  const handleStartTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStartTime = e.target.value;
    onChange({
      startTime: newStartTime,
      endTime: value.endTime
    });
  };

  // Handle end time selection
  const handleEndTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newEndTime = e.target.value;
    onChange({
      startTime: value.startTime,
      endTime: newEndTime
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select Time Slots
        </label>
        
        {/* Time slots visualization */}
        <div className="flex flex-wrap gap-1 mb-4">
          {availableHours.map((time, index) => {
            const isDisabled = isTimeSlotDisabled(time);
            const isSelected = time >= value.startTime && time < value.endTime;
            
            return (
              <div 
                key={time}
                className={`
                  p-2 rounded text-center w-16 text-sm cursor-pointer border
                  ${isDisabled 
                    ? 'bg-red-100 border-red-300 text-red-800' 
                    : isSelected
                      ? 'bg-rose-500 text-white border-rose-600'
                      : 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200'
                  }
                `}
                onClick={() => {
                  if (!isDisabled) {
                    // If no start time is selected, set this as start time
                    if (!value.startTime) {
                      onChange({
                        startTime: time,
                        endTime: ''
                      });
                    } 
                    // If start time is already selected but no end time, set this as end time
                    else if (!value.endTime && time > value.startTime) {
                      onChange({
                        startTime: value.startTime,
                        endTime: time
                      });
                    } 
                    // If both times are selected, start a new selection
                    else {
                      onChange({
                        startTime: time,
                        endTime: ''
                      });
                    }
                  }
                }}
              >
                {time}
                {isDisabled && <div className="text-xs">Booked</div>}
                {!isDisabled && <div className="text-xs">Free</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Standard dropdown selectors for precise selection */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Time
          </label>
          <select
            value={value.startTime}
            onChange={handleStartTimeChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">Select start time</option>
            {availableHours.map((time) => (
              <option 
                key={`start-${time}`} 
                value={time}
                disabled={isTimeSlotDisabled(time)}
              >
                {time} {isTimeSlotDisabled(time) ? "(Booked)" : ""}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Time
          </label>
          <select
            value={value.endTime}
            onChange={handleEndTimeChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            disabled={!value.startTime}
          >
            <option value="">Select end time</option>
            {availableHours
              .filter(time => {
                if (!value.startTime) return false;
                
                // Calculate the minimum end time based on minDuration
                const startHour = parseInt(value.startTime.split(':')[0]);
                const minEndHour = startHour + minDuration;
                const minEndTime = `${minEndHour.toString().padStart(2, '0')}:00`;
                
                // End time must be after start time + minDuration
                return time > minEndTime;
              })
              .map((time) => {
                // Check if there are any disabled slots between start and end
                const hasDisabledSlotsBetween = availableHours
                  .filter(t => t >= value.startTime && t < time)
                  .some(t => isTimeSlotDisabled(t));
                
                return (
                  <option 
                    key={`end-${time}`} 
                    value={time}
                    disabled={hasDisabledSlotsBetween}
                  >
                    {time} {hasDisabledSlotsBetween ? "(Unavailable)" : ""}
                  </option>
                );
              })}
          </select>
        </div>
      </div>
    </div>
  );
};

export default TimeRangePicker;





// 'use client';

// import React, { useMemo } from 'react';

// interface TimeRangePickerProps {
//   value: { startTime: string; endTime: string };
//   onChange: (value: { startTime: string; endTime: string }) => void;
//   disabledTimeSlots?: { startTime: string; endTime: string }[];
//   minDuration?: number;
//   maxTime?: string;
// }

// const TimeRangePicker: React.FC<TimeRangePickerProps> = ({
//   value,
//   onChange,
//   disabledTimeSlots = [],
//   minDuration = 3,
//   maxTime = '22:00'
// }) => {
//   // Generate time slots from 9 AM to maxTime
//   const timeSlots = useMemo(() => {
//     const slots = [];
//     const maxHour = parseInt(maxTime.split(':')[0]);
    
//     for (let hour = 9; hour <= maxHour; hour++) {
//       slots.push(`${hour.toString().padStart(2, '0')}:00`);
//     }
//     return slots;
//   }, [maxTime]);
  
//   // Check if a time slot is disabled
//   const isTimeSlotDisabled = (time: string) => {
//     return disabledTimeSlots.some(slot => {
//       const slotStartHour = parseInt(slot.startTime.split(':')[0]);
//       const slotEndHour = parseInt(slot.endTime.split(':')[0]);
//       const timeHour = parseInt(time.split(':')[0]);
      
//       return timeHour >= slotStartHour && timeHour < slotEndHour;
//     });
//   };
  
//   // Generate available end times based on selected start time
//   const availableEndTimes = useMemo(() => {
//     if (!value.startTime) return [];
    
//     const startHour = parseInt(value.startTime.split(':')[0]);
//     const minEndHour = startHour + minDuration;
//     const maxHour = parseInt(maxTime.split(':')[0]);
    
//     const endTimes = [];
//     for (let hour = minEndHour; hour <= maxHour; hour++) {
//       endTimes.push(`${hour.toString().padStart(2, '0')}:00`);
//     }
    
//     // Filter out disabled time slots
//     return endTimes.filter(time => !isTimeSlotDisabled(time));
//   }, [value.startTime, minDuration, maxTime, isTimeSlotDisabled]);
  
//   return (
//     <div className="space-y-4">
//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-1">
//           Start Time
//         </label>
//         <select
//           value={value.startTime}
//           onChange={(e) => {
//             onChange({
//               startTime: e.target.value,
//               endTime: '' // Reset end time when start time changes
//             });
//           }}
//           className="w-full p-2 border border-gray-300 rounded-md"
//         >
//           <option value="">Select start time</option>
//           {timeSlots.map((time) => (
//             <option
//               key={time}
//               value={time}
//               disabled={isTimeSlotDisabled(time)}
//             >
//               {time}
//             </option>
//           ))}
//         </select>
//       </div>
      
//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-1">
//           End Time
//         </label>
//         <select
//           value={value.endTime}
//           onChange={(e) => {
//             onChange({
//               ...value,
//               endTime: e.target.value
//             });
//           }}
//           className="w-full p-2 border border-gray-300 rounded-md"
//           disabled={!value.startTime}
//         >
//           <option value="">Select end time</option>
//           {availableEndTimes.map((time) => (
//             <option key={time} value={time}>
//               {time}
//             </option>
//           ))}
//         </select>
        
//         {value.startTime && !availableEndTimes.length && (
//           <p className="text-sm text-rose-500 mt-1">
//             No available end times for this start time. Please try another start time.
//           </p>
//         )}
//       </div>
//     </div>
//   );
// };

// export default TimeRangePicker;