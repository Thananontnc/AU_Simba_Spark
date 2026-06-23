'use server';

import { revalidatePath } from 'next/cache';
import sql from '@/lib/db';
import { auth } from '@/auth';

export async function createBooking(formData: FormData) {
  const session = await auth();
  const instructorId = parseInt(session!.user.id);

  const section_id = parseInt(formData.get('section_id') as string);
  const date       = formData.get('date') as string;
  const start_time = formData.get('start_time') as string;
  const end_time   = formData.get('end_time') as string;
  const room       = (formData.get('room') as string || '').trim();

  if (!section_id || !date || !start_time || !end_time) {
    return { error: 'All fields are required.' };
  }
  if (start_time >= end_time) {
    return { error: 'End time must be after start time.' };
  }

  // Conflict 1 — same room at overlapping time
  if (room) {
    const [roomConflict] = await sql`
      SELECT b.id FROM bookings b
      WHERE b.room = ${room}
        AND b.date = ${date}::date
        AND b.start_time < ${end_time}::time
        AND b.end_time   > ${start_time}::time
      LIMIT 1
    `;
    if (roomConflict) {
      return { error: `Room ${room} is already booked at that time.` };
    }
  }

  // Conflict 2 — same instructor already has a booking
  const [instrConflict] = await sql`
    SELECT b.id FROM bookings b
    JOIN sections s ON s.id = b.section_id
    WHERE s.instructor_id = ${instructorId}
      AND b.date = ${date}::date
      AND b.start_time < ${end_time}::time
      AND b.end_time   > ${start_time}::time
    LIMIT 1
  `;
  if (instrConflict) {
    return { error: 'You already have another booking at that time.' };
  }

  // Conflict 3 — enrolled student already has a booking at that time
  const [studentConflict] = await sql`
    SELECT b.id FROM bookings b
    JOIN enrollments e ON e.section_id = b.section_id
    WHERE e.student_id IN (
      SELECT student_id FROM enrollments WHERE section_id = ${section_id}
    )
      AND b.section_id != ${section_id}
      AND b.date = ${date}::date
      AND b.start_time < ${end_time}::time
      AND b.end_time   > ${start_time}::time
    LIMIT 1
  `;
  if (studentConflict) {
    return { error: 'An enrolled student already has a class at that time.' };
  }

  await sql`
    INSERT INTO bookings (section_id, date, start_time, end_time, room)
    VALUES (
      ${section_id},
      ${date}::date,
      ${start_time}::time,
      ${end_time}::time,
      ${room || null}
    )
  `;

  revalidatePath('/instructor/booking');
  return { success: true };
}

export async function deleteBooking(formData: FormData) {
  const session = await auth();
  const instructorId = parseInt(session!.user.id);
  const id = parseInt(formData.get('id') as string);

  // Only allow deleting bookings that belong to this instructor's sections
  await sql`
    DELETE FROM bookings
    WHERE id = ${id}
      AND section_id IN (
        SELECT id FROM sections WHERE instructor_id = ${instructorId}
      )
  `;

  revalidatePath('/instructor/booking');
  return { success: true };
}
