'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bus, Droplet, Brush, AlertTriangle, MapPin, Search, CheckCircle, Clock, MessageSquare, BarChart2, Calendar, Package, Users, FileText, Moon, Sun, Bell, Send, Boxes } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useTheme } from "next-themes"
import Map from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'

// Mock API for live bus tracking
const fetchBusLocations = async () => {
  await new Promise(resolve => setTimeout(resolve, 1000))
  return [
    { id: 1, number: 'Bus 1', lat: 37.7749, lng: -122.4194, speed: 35, route: 'Route A', eta: '10 min' },
    { id: 2, number: 'Bus 2', lat: 37.7848, lng: -122.4294, speed: 28, route: 'Route B', eta: '15 min' },
    { id: 3, number: 'Bus 3', lat: 37.7648, lng: -122.4094, speed: 40, route: 'Route C', eta: '5 min' },
  ]
}

const TaskCard = ({ task, onComplete }) => (
  <Card className="mb-4 hover:shadow-lg transition-shadow duration-300">
    <CardHeader>
      <CardTitle className="flex items-center justify-between">
        <span>{task.busNumber}</span>
        <Badge variant={
          task.status === 'completed' ? 'success' :
          task.status === 'in-progress' ? 'warning' :
          'secondary'
        }>
          {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
        </Badge>
      </CardTitle>
      <CardDescription>{task.type.charAt(0).toUpperCase() + task.type.slice(1)}</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="flex items-center space-x-2">
        <Button size="sm" onClick={() => onComplete(task.id)}>
          {task.status === 'completed' ? 'Completed' : 'Complete Task'}
        </Button>
        <Button size="sm" variant="outline">Report Issue</Button>
      </div>
    </CardContent>
  </Card>
)

const IncidentCard = ({ incident, onResolve, onEscalate }) => (
  <Card className="mb-4 hover:shadow-lg transition-shadow duration-300">
    <CardHeader>
      <CardTitle className="flex items-center justify-between">
        <span>{incident.busNumber}</span>
        <Badge variant={incident.type === 'minor' ? 'warning' : 'destructive'}>
          {incident.type.charAt(0).toUpperCase() + incident.type.slice(1)}
        </Badge>
      </CardTitle>
      <CardDescription>{incident.description}</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="flex items-center space-x-2">
        <Button size="sm" onClick={() => onResolve(incident.id)}>Resolve</Button>
        <Button size="sm" variant="outline" onClick={() => onEscalate(incident.id)}>Escalate</Button>
      </div>
    </CardContent>
  </Card>
)

const BusMarker = ({ bus, onClick }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger>
        <motion.div
          className="text-blue-500 cursor-pointer"
          whileHover={{ scale: 1.2 }}
          onClick={() => onClick(bus)}
        >
          <Bus size={24} />
        </motion.div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{bus.number}</p>
        <p>Route: {bus.route}</p>
        <p>Speed: {bus.speed} km/h</p>
        <p>ETA: {bus.eta}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
)

const MessageCard = ({ message, currentUser }) => (
  <div className={`flex ${message.sender === currentUser ? 'justify-end' : 'justify-start'} mb-4`}>
    <div className={`max-w-xs ${message.sender === currentUser ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'} rounded-lg p-3`}>
      <p className="text-sm font-semibold">{message.sender}</p>
      <p>{message.content}</p>
      <p className="text-xs text-right mt-1">{message.timestamp}</p>
    </div>
  </div>
)

const historicalData = [
  { name: 'Week 1', efficiency: 75 },
  { name: 'Week 2', efficiency: 80 },
  { name: 'Week 3', efficiency: 85 },
  { name: 'Week 4', efficiency: 82 },
  { name: 'Week 5', efficiency: 88 },
  { name: 'Week 6', efficiency: 90 },
]

export function TransitOperationsAppComponent() {
  const [role, setRole] = useState('driver')
  const [activeTab, setActiveTab] = useState('tasks')
  const [busNumber, setBusNumber] = useState('')
  const [clockedIn, setClockedIn] = useState(false)
  const [tasks, setTasks] = useState([
    { id: 1, busNumber: 'Bus 1', type: 'clean', status: 'pending' },
    { id: 2, busNumber: 'Bus 2', type: 'refuel', status: 'in-progress' },
    { id: 3, busNumber: 'Bus 3', type: 'maintenance', status: 'completed' },
  ])
  const [incidents, setIncidents] = useState([
    { id: 1, busNumber: 'Bus 1', type: 'minor', description: 'Seat cushion torn', status: 'pending' },
    { id: 2, busNumber: 'Bus 2', type: 'major', description: 'Engine overheating', status: 'in-progress' },
  ])
  const [busLocations, setBusLocations] = useState([])
  const [liveUpdates, setLiveUpdates] = useState(true)
  const { theme, setTheme } = useTheme()
  const [viewState, setViewState] = useState({
    latitude: 37.7749,
    longitude: -122.4194,
    zoom: 12
  })
  const [trackedBus, setTrackedBus] = useState(null)
  const [messages, setMessages] = useState([
    { id: 1, sender: 'Helen Diasinas (Manager)', content: 'Noel, could you fill in at Mile End tonight at 6:00pm?', timestamp: '10:30 AM' },
    { id: 2, sender: 'Noel Clarke (Supervisor)', content: 'Yeah no worries.', timestamp: '10:32 AM' },
  ])
  const [newMessage, setNewMessage] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      if (liveUpdates) {
        const locations = await fetchBusLocations()
        setBusLocations(locations)
        if (trackedBus) {
          const trackedLocation = locations.find(bus => bus.number === trackedBus)
          if (trackedLocation) {
            setViewState({
              latitude: trackedLocation.lat,
              longitude: trackedLocation.lng,
              zoom: 14
            })
          }
        }
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 5000) // Update every 5 seconds
    return () => clearInterval(interval)
  }, [liveUpdates, trackedBus])

  const handleClockInOut = () => {
    setClockedIn(!clockedIn)
    console.log(`Employee ${clockedIn ? 'clocked out' : 'clocked in'}`)
  }

  const handleTaskCompletion = (taskId) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, status: 'completed' } : task
    ))
  }

  const handleIncidentReport = (e) => {
    e.preventDefault()
    const newIncident = {
      id: incidents.length + 1,
      busNumber,
      type: e.target.incidentType.value,
      description: e.target.description.value,
      status: 'pending'
    }
    setIncidents([...incidents, newIncident])
    setBusNumber('')
    e.target.reset()
  }

  const handleIncidentResolve = (incidentId) => {
    setIncidents(incidents.map(incident => 
      incident.id === incidentId ? { ...incident, status: 'resolved' } : incident
    ))
  }

  const handleIncidentEscalate = (incidentId) => {
    setIncidents(incidents.map(incident => 
      incident.id === incidentId ? { ...incident, status: 'escalated' } : incident
    ))
  }

  const handleBusClick = (bus) => {
    console.log('Bus clicked:', bus)
    setTrackedBus(bus.number)
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (newMessage.trim()) {
      const newMsg = {
        id: messages.length + 1,
        sender: `${role.charAt(0).toUpperCase() + role.slice(1)}`,
        content: newMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages([...messages, newMsg])
      setNewMessage('')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-2 sm:p-4 transition-colors duration-300">
      <header className="mb-4 sm:mb-8 flex flex-col sm:flex-row justify-between items-center">
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-0">Transit Operations</h1>
        <div className="flex flex-wrap justify-center sm:justify-end items-center space-y-2 sm:space-y-0 space-x-2 sm:space-x-4">
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="w-[140px] sm:w-[180px]">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="supervisor">Supervisor</SelectItem>
              <SelectItem value="driver">Driver</SelectItem>
              <SelectItem value="cleaner">Cleaner</SelectItem>
              <SelectItem value="refueller">Refueller</SelectItem>
              <SelectItem value="mechanic">Mechanic</SelectItem>
            </SelectContent>
          </Select>
          <Avatar>
            <AvatarImage src="/placeholder.svg" alt="Employee avatar" />
            <AvatarFallback>EMP</AvatarFallback>
          </Avatar>
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-xl mb-4 sm:mb-8">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold dark:text-white mb-2 sm:mb-0">Welcome, {role.charAt(0).toUpperCase() + role.slice(1)}</h2>
              <Button onClick={handleClockInOut} variant={clockedIn ? "destructive" : "default"} className="w-full sm:w-auto">
                {clockedIn ? 'Clock Out' : 'Clock In'}
              </Button>
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="flex flex-wrap justify-start gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2">
                <TabsTrigger value="tasks" className="flex-shrink-0"><CheckCircle className="mr-2" size={18} />Tasks</TabsTrigger>
                <TabsTrigger value="incidents" className="flex-shrink-0"><AlertTriangle className="mr-2" size={18} />Incidents</TabsTrigger>
                <TabsTrigger value="tracking" className="flex-shrink-0"><MapPin className="mr-2" size={18} />Tracking</TabsTrigger>
                <TabsTrigger value="messages" className="flex-shrink-0"><MessageSquare className="mr-2" size={18} />Messages</TabsTrigger>
                {role === 'manager' && (
                  <>
                    <TabsTrigger value="inventory" className="flex-shrink-0"><Boxes className="mr-2" size={18} />Inventory</TabsTrigger>
                    <TabsTrigger value="dashboard" className="flex-shrink-0"><BarChart2 className="mr-2" size={18} />Dashboard</TabsTrigger>
                  </>
                )}
              </TabsList>

              <TabsContent value="tasks">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <div className="space-y-4 pr-4">
                    <h3 className="text-lg sm:text-xl font-semibold dark:text-white">Today's Tasks</h3>
                    {tasks.map(task => (
                      <TaskCard key={task.id} task={task} onComplete={handleTaskCompletion} />
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="incidents">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <form onSubmit={handleIncidentReport} className="space-y-4 mb-6 sm:mb-8">
                    <h3 className="text-lg sm:text-xl font-semibold dark:text-white">Report Incident</h3>
                    <div className="space-y-2">
                      <Label htmlFor="busNumber">Bus Number</Label>
                      <Input
                        id="busNumber"
                        value={busNumber}
                        onChange={(e) => setBusNumber(e.target.value)}
                        placeholder="Enter bus number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="incidentType">Incident Type</Label>
                      <Select name="incidentType">
                        <SelectTrigger>
                          <SelectValue placeholder="Select incident type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minor">Minor</SelectItem>
                          <SelectItem value="major">Major</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea name="description" placeholder="Describe the incident" required />
                    </div>
                    <Button type="submit" className="w-full sm:w-auto">Report Incident</Button>
                  </form>
                  <div className="space-y-4 pr-4">
                    <h3 className="text-lg sm:text-xl font-semibold dark:text-white">Recent Incidents</h3>
                    {incidents.map(incident => (
                      <IncidentCard 
                        key={incident.id} 
                        incident={incident} 
                        onResolve={handleIncidentResolve}
                        onEscalate={handleIncidentEscalate}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="tracking">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <h3 className="text-lg sm:text-xl font-semibold dark:text-white mb-2 sm:mb-0">Live Bus Tracking</h3>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="live-updates">Live Updates</Label>
                      <Switch
                        id="live-updates"
                        checked={liveUpdates}
                        onCheckedChange={setLiveUpdates}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 mb-4">
                    <Input
                      placeholder="Enter bus number to track"
                      value={trackedBus || ''}
                      onChange={(e) => setTrackedBus(e.target.value)}
                      className="flex-grow"
                    />
                    <Button onClick={() => setTrackedBus(null)} className="w-full sm:w-auto">Clear</Button>
                  </div>
                  <div className="h-[calc(100vh-400px)] rounded-lg overflow-hidden">
                    <Map
                      {...viewState}
                      onMove={evt => setViewState(evt.viewState)}
                      mapStyle="mapbox://styles/mapbox/dark-v10"
                      mapboxAccessToken="YOUR_MAPBOX_ACCESS_TOKEN"
                    >
                      {busLocations.map(bus => (
                        <BusMarker
                          key={bus.id}
                          bus={bus}
                          onClick={handleBusClick}
                        />
                      ))}
                    </Map>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="messages">
                <div className="space-y-4">
                  <h3 className="text-lg sm:text-xl font-semibold dark:text-white">Team Messages</h3>
                  <ScrollArea className="h-[calc(100vh-400px)] mb-4">
                    <div className="space-y-4 pr-4">
                      {messages.map(message => (
                        <MessageCard key={message.id} message={message} currentUser={`${role.charAt(0).toUpperCase() + role.slice(1)}`} />
                      ))}
                    </div>
                  </ScrollArea>
                  <form onSubmit={handleSendMessage} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Input
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-grow"
                    />
                    <Button type="submit" className="w-full sm:w-auto"><Send size={18} /></Button>
                  </form>
                </div>
              </TabsContent>

              {role === 'manager' && (
                <>
                  <TabsContent value="inventory">
                    <div className="space-y-4">
                      <h3 className="text-lg sm:text-xl font-semibold dark:text-white">Inventory Management</h3>
                      <Card>
                        <CardHeader>
                          <CardTitle>Current Inventory</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            <li className="flex justify-between items-center">
                              <span>Agar Wipeaway 30L</span>
                              <span>15</span>
                            </li>
                            <li className="flex justify-between items-center">
                              <span>Rags</span>
                              <span>27</span>
                            </li>
                            <li className="flex justify-between items-center">
                              <span>Mops</span>
                              <span>12</span>
                            </li>
                            <li className="flex justify-between items-center">
                              <span>Steam Cleaners</span>
                              <span>4</span>
                            </li>
                          </ul>
                        </CardContent>
                      </Card>
                      <Button className="w-full sm:w-auto">Order Supplies</Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="dashboard">
                    <div className="space-y-4">
                      <h3 className="text-lg sm:text-xl font-semibold dark:text-white">Weekly Progress Dashboard</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader>
                            <CardTitle>Buses Cleaned/Refuelled</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">85%</div>
                            <Progress value={85} className="mt-2" />
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader>
                            <CardTitle>Inventory Efficiency</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">92%</div>
                            <Progress value={92} className="mt-2" />
                          </CardContent>
                        </Card>
                      </div>
                      <Card>
                        <CardHeader>
                          <CardTitle>Historical Efficiency</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={historicalData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <RechartsTooltip />
                                <Line type="monotone" dataKey="efficiency" stroke="#8884d8" />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </main>

      <footer className="mt-4 sm:mt-8 text-center text-gray-600 dark:text-gray-400">
        <p className="text-xs sm:text-sm">&copy; 2024 Transit Operations. All rights reserved.</p>
      </footer>
    </div>
  )
}