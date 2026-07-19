"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useTranslation } from "@/lib/i18n"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Dumbbell, ScanLine, Check } from "lucide-react"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface CalendarEvent {
  date: string
  type: "workout" | "scan" | "checkin" | "streak"
  label: string
}

export function CalendarView() {
  const { t } = useTranslation()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [events] = useLocalStorage<CalendarEvent[]>("fitverse-calendar-events", [])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days: Date[] = []
  let day = calendarStart
  while (day <= calendarEnd) {
    days.push(day)
    day = addDays(day, 1)
  }

  const getEventsForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    return events.filter((e) => e.date === dateStr)
  }

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : []

  const eventIcons = {
    workout: Dumbbell,
    scan: ScanLine,
    checkin: Check,
    streak: Check,
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h3 className="text-sm font-semibold capitalize">
          {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">
            {d}
          </div>
        ))}
        {days.map((d, i) => {
          const dayEvents = getEventsForDate(d)
          const isCurrentMonth = isSameMonth(d, currentMonth)
          const isSelected = selectedDate && isSameDay(d, selectedDate)
          const today = isToday(d)

          return (
            <motion.button
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.01 }}
              onClick={() => setSelectedDate(d)}
              className={cn(
                "relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-all",
                !isCurrentMonth && "text-muted-foreground/30",
                isCurrentMonth && !isSelected && "text-foreground hover:bg-muted",
                isSelected && "bg-foreground text-background",
                today && !isSelected && "font-bold ring-2 ring-brand/30"
              )}
            >
              <span>{format(d, "d")}</span>
              {dayEvents.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {dayEvents.slice(0, 3).map((e, j) => (
                    <div
                      key={j}
                      className={cn(
                        "w-1 h-1 rounded-full",
                        isSelected ? "bg-background/60" : "bg-brand"
                      )}
                    />
                  ))}
                </div>
              )}
            </motion.button>
          )
        })}
      </div>

      {selectedDate && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-2">
                {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              </p>
              {selectedEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhuma atividade neste dia</p>
              ) : (
                <div className="space-y-2">
                  {selectedEvents.map((e, i) => {
                    const Icon = eventIcons[e.type]
                    return (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Icon className="w-4 h-4 text-brand" />
                        <span>{e.label}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
