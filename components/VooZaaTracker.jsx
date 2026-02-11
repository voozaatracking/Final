import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Download, Search, Database, Users, BarChart3, TrendingUp, FileText, MapPin, LogOut, Calendar, RotateCcw, Filter } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { storage } from '../lib/supabase';

// Traffic Light Component for monthly revenue
const TrafficLight = ({ revenue }) => {
  let color, label, bgColor, textColor;
  
  if (revenue >= 120) {
    color = '#22c55e'; // bright green
    bgColor = 'bg-green-100';
    textColor = 'text-green-700';
    label = 'Super';
  } else if (revenue >= 95) {
    color = '#4ade80'; // green
    bgColor = 'bg-green-50';
    textColor = 'text-green-600';
    label = 'Gut';
  } else if (revenue >= 60) {
    color = '#fbbf24'; // yellow/orange
    bgColor = 'bg-yellow-50';
    textColor = 'text-yellow-700';
    label = 'OK';
  } else if (revenue >= 30) {
    color = '#f87171'; // light red
    bgColor = 'bg-red-50';
    textColor = 'text-red-500';
    label = 'Schwach';
  } else {
    color = '#dc2626'; // dark red
    bgColor = 'bg-red-100';
    textColor = 'text-red-700';
    label = 'Kritisch';
  }
  
  return (
    <div className={`flex items-center gap-2 px-2 py-1 rounded-lg ${bgColor}`}>
      <div 
        className="w-4 h-4 rounded-full shadow-inner"
        style={{ 
          backgroundColor: color,
          boxShadow: revenue >= 120 ? `0 0 8px ${color}, 0 0 12px ${color}` : 'none'
        }}
      />
      <span className={`text-xs font-medium ${textColor}`}>{label}</span>
    </div>
  );
};

// ROI Circle Component
const ROICircle = ({ revenue, target = 1500, size = 80 }) => {
  const percentage = Math.min((revenue / target) * 100, 200);
  const roi = ((revenue / target) * 100).toFixed(0);
  const isComplete = revenue >= target;
  const isOverTarget = revenue > target;
  
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(percentage, 100) / 100) * circumference;
  const overTargetOffset = isOverTarget ? circumference - ((percentage - 100) / 100) * circumference : circumference;
  
  const baseColor = '#e5e7eb';
  const progressColor = isComplete ? '#22c55e' : '#ef4444';
  const overTargetColor = '#15803d';
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={baseColor}
            strokeWidth="6"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={progressColor}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500"
          />
          {isOverTarget && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={overTargetColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={overTargetOffset}
              className="transition-all duration-500"
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-xs font-bold ${isComplete ? 'text-green-600' : 'text-red-500'}`}>
            {roi}%
          </span>
          <span className="text-[8px] text-gray-500">ROI</span>
        </div>
      </div>
      <div className="text-[10px] text-center mt-1">
        <span className={isComplete ? 'text-green-600 font-semibold' : 'text-gray-500'}>
          {revenue.toFixed(0)} EUR
        </span>
        <span className="text-gray-400"> / {target} EUR</span>
      </div>
    </div>
  );
};

const DeviceTracker = ({ onLogout }) => {
  const [devices, setDevices] = useState([]);
  const [deletedDevices, setDeletedDevices] = useState([]);
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [employees, setEmployees] = useState([
    'FSEGO', 'Mitarbeiter 2', 'Mitarbeiter 3', 'Mitarbeiter 4', 'Mitarbeiter 5',
    'Mitarbeiter 6', 'Mitarbeiter 7', 'Mitarbeiter 8', 'Mitarbeiter 9', 'Mitarbeiter 10'
  ]);
  const [addresses, setAddresses] = useState([
    { id: 1, name: 'Hauptstandort', street: 'Musterstrasse 1', zip: '21335', city: 'Lueneburg' },
    { id: 2, name: 'Filiale Nord', street: 'Beispielweg 5', zip: '21335', city: 'Lueneburg' },
    { id: 3, name: 'Filiale Sued', street: 'Hauptstrasse 10', zip: '21337', city: 'Lueneburg' },
    { id: 4, name: 'Bahnhof', street: 'Bahnhofstrasse 3', zip: '21339', city: 'Lueneburg' },
  ]);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editName, setEditName] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [newAddress, setNewAddress] = useState({ name: '', street: '', zip: '', city: 'Lueneburg' });
  const [trafficLightFilter, setTrafficLightFilter] = useState('all');

  const deviceTypes = ['12 slot', '24 slot', '28 slot'];
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const monthNames = ['Jan', 'Feb', 'Maer', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'];

  const today = new Date();
  const currentMonth = today.getMonth();
  const realCurrentYear = today.getFullYear();
  
  const [selectedYear, setSelectedYear] = useState(realCurrentYear);
  const [availableYears, setAvailableYears] = useState([2026, 2027, 2028, 2029, 2030]);
  
  const [selectedReportMonth, setSelectedReportMonth] = useState(currentMonth);
  const [importMonth, setImportMonth] = useState(currentMonth);
  const [employeeViewMonth, setEmployeeViewMonth] = useState(currentMonth);

  const getDeviceRevenue = (device, month, year = selectedYear) => {
    if (device.revenue && device.revenue[year] && device.revenue[year][month] !== undefined) {
      return parseFloat(device.revenue[year][month]) || 0;
    }
    if (year === 2026 && device[month] !== undefined) {
      return parseFloat(device[month]) || 0;
    }
    return 0;
  };

  const getDeviceYearRevenue = (device, year = selectedYear) => {
    return months.reduce((sum, m) => sum + getDeviceRevenue(device, m, year), 0);
  };

  const getDeviceCurrentMonthRevenue = (device) => {
    return getDeviceRevenue(device, months[currentMonth], selectedYear);
  };

  const getTrafficLightCategory = (revenue) => {
    if (revenue >= 120) return 'super';
    if (revenue >= 95) return 'gut';
    if (revenue >= 60) return 'ok';
    if (revenue >= 30) return 'schwach';
    return 'kritisch';
  };

  const setDeviceRevenue = (device, month, value, year = selectedYear) => {
    const newDevice = { ...device };
    if (!newDevice.revenue) {
      newDevice.revenue = {};
    }
    if (!newDevice.revenue[year]) {
      newDevice.revenue[year] = {};
    }
    newDevice.revenue[year][month] = parseFloat(value) || 0;
    return newDevice;
  };

  const migrateDeviceData = (device) => {
    if (device.revenue) return device;
    
    const newDevice = { ...device, revenue: { 2026: {} } };
    months.forEach(m => {
      if (device[m] !== undefined) {
        newDevice.revenue[2026][m] = parseFloat(device[m]) || 0;
      }
    });
    months.forEach(m => delete newDevice[m]);
    return newDevice;
  };

  const getCurrentQuarter = (month = currentMonth) => {
    const quarter = Math.floor(month / 3);
    const quarterStartMonth = quarter * 3;
    const quarterMonths = [];
    for (let i = 0; i < 3; i++) {
      quarterMonths.push(months[quarterStartMonth + i]);
    }
    return quarterMonths;
  };

  const quarterMonths = getCurrentQuarter();
  const currentQuarterNumber = Math.floor(currentMonth / 3) + 1;

  useEffect(() => {
    const loadData = async () => {
      try {
        const devicesData = await storage.get('devices');
        const deletedDevicesData = await storage.get('deletedDevices');
        const employeesData = await storage.get('employees');
        const addressesData = await storage.get('addresses');
        const yearsData = await storage.get('availableYears');
        
        if (devicesData && devicesData.value) {
          let loadedDevices = JSON.parse(devicesData.value);
          loadedDevices = loadedDevices.map(d => migrateDeviceData(d));
          setDevices(loadedDevices);
        } else {
          setDevices([
            {
              id: 1, deviceNumber: 'DEV001', deviceType: '12 slot', address: 'Musterstrasse 1, 21335 Lueneburg',
              partnerName: 'Partner A', owner: 'FSEGO', hours: 5,
              revenue: { 2026: { jan: 100, feb: 150, mar: 120, apr: 180, may: 160, jun: 200, jul: 190, aug: 210, sep: 170, oct: 180, nov: 220, dec: 240 } }
            },
            {
              id: 2, deviceNumber: 'DEV002', deviceType: '24 slot', address: 'Beispielweg 5, 21335 Lueneburg',
              partnerName: 'Partner B', owner: 'Mitarbeiter 2', hours: 7,
              revenue: { 2026: { jan: 80, feb: 45, mar: 100, apr: 55, may: 130, jun: 25, jul: 150, aug: 170, sep: 140, oct: 150, nov: 180, dec: 200 } }
            },
            {
              id: 3, deviceNumber: 'DEV003', deviceType: '28 slot', address: 'Hauptstrasse 10, 21337 Lueneburg',
              partnerName: 'Partner A', owner: 'FSEGO', hours: 8,
              revenue: { 2026: { jan: 120, feb: 180, mar: 150, apr: 200, may: 190, jun: 220, jul: 210, aug: 240, sep: 200, oct: 210, nov: 250, dec: 280 } }
            },
            {
              id: 4, deviceNumber: 'DEV004', deviceType: '12 slot', address: 'Bahnhofstrasse 3, 21339 Lueneburg',
              partnerName: 'Partner C', owner: 'Mitarbeiter 3', hours: 4,
              revenue: { 2026: { jan: 20, feb: 35, mar: 28, apr: 42, may: 38, jun: 48, jul: 44, aug: 52, sep: 42, oct: 46, nov: 56, dec: 64 } }
            }
          ]);
        }
        
        if (employeesData && employeesData.value) {
          const loadedEmployees = JSON.parse(employeesData.value);
          if (loadedEmployees.length === 10) {
            setEmployees(loadedEmployees);
          }
        }

        if (deletedDevicesData && deletedDevicesData.value) {
          setDeletedDevices(JSON.parse(deletedDevicesData.value));
        }
        
        if (addressesData && addressesData.value) {
          setAddresses(JSON.parse(addressesData.value));
        }

        if (yearsData && yearsData.value) {
          setAvailableYears(JSON.parse(yearsData.value));
        }
      } catch (error) {
        console.log('Keine gespeicherten Daten, verwende Beispieldaten');
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const saveData = async () => {
      if (devices.length > 0) {
        try {
          await storage.set('devices', JSON.stringify(devices));
          await storage.set('deletedDevices', JSON.stringify(deletedDevices));
          await storage.set('employees', JSON.stringify(employees));
          await storage.set('addresses', JSON.stringify(addresses));
          await storage.set('availableYears', JSON.stringify(availableYears));
          setSaveStatus('Gespeichert');
          setTimeout(() => setSaveStatus(''), 2000);
        } catch (error) {
          console.error('Speicherfehler:', error);
        }
      }
    };
    saveData();
  }, [devices, deletedDevices, employees, addresses, availableYears]);

  const addDevice = () => {
    const newDevice = {
      id: Date.now(), deviceNumber: '', deviceType: '', address: '', partnerName: '', owner: '', hours: 0,
      revenue: { [selectedYear]: { jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0, jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0 } }
    };
    setDevices([...devices, newDevice]);
  };

  const deleteDevice = (id) => {
    const deviceToDelete = devices.find(d => d.id === id);
    if (deviceToDelete) {
      const deletedDevice = {
        ...deviceToDelete,
        deletedAt: new Date().toISOString()
      };
      setDeletedDevices([deletedDevice, ...deletedDevices]);
      setDevices(devices.filter(d => d.id !== id));
      setSaveStatus('Geraet in Papierkorb verschoben');
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  const restoreDevice = (id) => {
    const deviceToRestore = deletedDevices.find(d => d.id === id);
    if (deviceToRestore) {
      const { deletedAt, ...restoredDevice } = deviceToRestore;
      setDevices([...devices, restoredDevice]);
      setDeletedDevices(deletedDevices.filter(d => d.id !== id));
      setSaveStatus('Geraet wiederhergestellt');
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  const permanentlyDeleteDevice = (id) => {
    setDeletedDevices(deletedDevices.filter(d => d.id !== id));
    setSaveStatus('Geraet endgueltig geloescht');
    setTimeout(() => setSaveStatus(''), 2000);
  };

  const emptyTrash = () => {
    if (deletedDevices.length > 0 && confirm('Papierkorb wirklich leeren? Dies kann nicht rueckgaengig gemacht werden!')) {
      setDeletedDevices([]);
      setSaveStatus('Papierkorb geleert');
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  const addAddress = () => {
    if (newAddress.name && newAddress.street && newAddress.zip && newAddress.city) {
      setAddresses([...addresses, { id: Date.now(), ...newAddress }]);
      setNewAddress({ name: '', street: '', zip: '', city: 'Lueneburg' });
      setShowAddressModal(false);
    }
  };

  const deleteAddress = (id) => {
    setAddresses(addresses.filter(a => a.id !== id));
  };

  const getFullAddress = (addr) => `${addr.street}, ${addr.zip} ${addr.city}`;

  const handleSimpleImport = () => {
    if (!importText.trim()) return;
    
    const lines = importText.trim().split('\n');
    const monthKey = months[importMonth];
    let updatedDevices = [...devices];
    let importCount = 0;
    
    for (const line of lines) {
      const match = line.match(/^(.+?)[\s:,;]+(\d+(?:[.,]\d+)?)\s*$/);
      if (!match) continue;
      
      const searchName = match[1].trim().toLowerCase();
      const revenue = parseFloat(match[2].replace(',', '.'));
      
      if (isNaN(revenue)) continue;
      
      let deviceIndex = -1;
      
      for (let i = 0; i < updatedDevices.length; i++) {
        const device = updatedDevices[i];
        const addr = addresses.find(a => getFullAddress(a) === device.address);
        
        if (addr && (
          addr.name.toLowerCase().includes(searchName) ||
          searchName.includes(addr.name.toLowerCase()) ||
          addr.name.toLowerCase() === searchName
        )) {
          deviceIndex = i;
          break;
        }
        
        if (device.partnerName && (
          device.partnerName.toLowerCase().includes(searchName) ||
          searchName.includes(device.partnerName.toLowerCase())
        )) {
          deviceIndex = i;
          break;
        }
      }
      
      if (deviceIndex >= 0) {
        const currentValue = getDeviceRevenue(updatedDevices[deviceIndex], monthKey, selectedYear);
        updatedDevices[deviceIndex] = setDeviceRevenue(updatedDevices[deviceIndex], monthKey, currentValue + revenue, selectedYear);
        importCount++;
      }
    }
    
    if (importCount > 0) {
      setDevices(updatedDevices);
      setImportText('');
      setShowImportModal(false);
      setSaveStatus(`${importCount} Eintraege importiert fuer ${selectedYear}`);
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const updateDevice = (id, field, value) => {
    setDevices(devices.map(d => {
      if (d.id !== id) return d;
      
      if (months.includes(field)) {
        return setDeviceRevenue(d, field, value, selectedYear);
      }
      
      return { ...d, [field]: field === 'hours' ? parseFloat(value) || 0 : value };
    }));
  };

  const startEditEmployee = (index) => {
    setEditingEmployee(index);
    setEditName(employees[index]);
  };

  const saveEmployeeName = () => {
    if (editName.trim() && editingEmployee !== null) {
      const oldName = employees[editingEmployee];
      const newName = editName.trim();
      const newEmployees = [...employees];
      newEmployees[editingEmployee] = newName;
      setEmployees(newEmployees);
      setDevices(devices.map(d => d.owner === oldName ? { ...d, owner: newName } : d));
      setEditingEmployee(null);
      setEditName('');
    }
  };

  const cancelEdit = () => {
    setEditingEmployee(null);
    setEditName('');
  };

  const employeeStats = useMemo(() => {
    const selectedQuarter = Math.floor(employeeViewMonth / 3);
    const selectedQuarterStartMonth = selectedQuarter * 3;
    const selectedQuarterMonths = [];
    for (let i = 0; i < 3; i++) {
      if (selectedQuarterStartMonth + i <= employeeViewMonth) {
        selectedQuarterMonths.push(months[selectedQuarterStartMonth + i]);
      }
    }
    
    const yearMonthsUntilSelected = months.slice(0, employeeViewMonth + 1);
    
    return employees.map(emp => {
      const empDevices = devices.filter(d => d.owner === emp);
      const deviceCount = empDevices.length;
      const avgHours = deviceCount > 0 ? empDevices.reduce((sum, d) => sum + d.hours, 0) / deviceCount : 0;
      const monthRevenue = empDevices.reduce((sum, d) => sum + getDeviceRevenue(d, months[employeeViewMonth], selectedYear), 0);
      const quarterRevenue = empDevices.reduce((sum, d) => sum + selectedQuarterMonths.reduce((qSum, m) => qSum + getDeviceRevenue(d, m, selectedYear), 0), 0);
      const yearRevenue = empDevices.reduce((sum, d) => sum + yearMonthsUntilSelected.reduce((ySum, m) => ySum + getDeviceRevenue(d, m, selectedYear), 0), 0);
      const monthlyPayout = monthRevenue * 0.1;

      return {
        name: emp, deviceCount, avgHours: avgHours.toFixed(1),
        monthRevenue: monthRevenue.toFixed(2), quarterRevenue: quarterRevenue.toFixed(2),
        yearRevenue: yearRevenue.toFixed(2), monthlyPayout: monthlyPayout.toFixed(2)
      };
    });
  }, [devices, employees, employeeViewMonth, selectedYear]);

  // Chart data for monthly revenue per employee
  const chartData = useMemo(() => {
    const result = [];
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const monthKey = months[monthIndex];
      const dataPoint = { month: monthNames[monthIndex] };
      
      for (let empIndex = 0; empIndex < 10; empIndex++) {
        const empName = employees[empIndex];
        let monatsSumme = 0;
        
        for (let devIndex = 0; devIndex < devices.length; devIndex++) {
          const device = devices[devIndex];
          if (device.owner === empName) {
            monatsSumme += getDeviceRevenue(device, monthKey, selectedYear);
          }
        }
        
        dataPoint[empName] = monatsSumme;
      }
      
      result.push(dataPoint);
    }
    return result;
  }, [devices, employees, selectedYear]);

  // Cumulative chart data for year revenue per employee
  const cumulativeChartData = useMemo(() => {
    const result = [];
    const cumulative = {};
    
    employees.forEach(emp => {
      cumulative[emp] = 0;
    });
    
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const monthKey = months[monthIndex];
      const dataPoint = { month: monthNames[monthIndex] };
      
      for (let empIndex = 0; empIndex < 10; empIndex++) {
        const empName = employees[empIndex];
        let monatsSumme = 0;
        
        for (let devIndex = 0; devIndex < devices.length; devIndex++) {
          const device = devices[devIndex];
          if (device.owner === empName) {
            monatsSumme += getDeviceRevenue(device, monthKey, selectedYear);
          }
        }
        
        cumulative[empName] += monatsSumme;
        dataPoint[empName] = cumulative[empName];
      }
      
      result.push(dataPoint);
    }
    return result;
  }, [devices, employees, selectedYear]);

  const hasChartData = useMemo(() => {
    return devices.some(d => months.some(m => getDeviceRevenue(d, m, selectedYear) > 0));
  }, [devices, selectedYear]);

  const filteredDevices = useMemo(() => {
    let filtered = devices;
    
    // Text search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(d => {
        if (searchType === 'all') {
          return (
            (d.partnerName && d.partnerName.toLowerCase().includes(query)) ||
            (d.deviceNumber && d.deviceNumber.toLowerCase().includes(query)) ||
            (d.owner && d.owner.toLowerCase().includes(query)) ||
            (d.address && d.address.toLowerCase().includes(query))
          );
        }
        if (searchType === 'partner') return d.partnerName && d.partnerName.toLowerCase().includes(query);
        if (searchType === 'device') return d.deviceNumber && d.deviceNumber.toLowerCase().includes(query);
        if (searchType === 'owner') return d.owner && d.owner.toLowerCase().includes(query);
        return true;
      });
    }
    
    // Traffic light filter
    if (trafficLightFilter !== 'all') {
      filtered = filtered.filter(d => {
        const monthRevenue = getDeviceCurrentMonthRevenue(d);
        const category = getTrafficLightCategory(monthRevenue);
        return category === trafficLightFilter;
      });
    }
    
    return filtered;
  }, [devices, searchQuery, searchType, trafficLightFilter, selectedYear]);

  // Sort devices by traffic light status for database view
  const sortedFilteredDevices = useMemo(() => {
    return [...filteredDevices].sort((a, b) => {
      const aRev = getDeviceCurrentMonthRevenue(a);
      const bRev = getDeviceCurrentMonthRevenue(b);
      return bRev - aRev; // Best to worst
    });
  }, [filteredDevices]);

  const exportData = () => {
    const data = JSON.stringify({ devices, employees, addresses, availableYears, exportDate: new Date().toISOString(), selectedYear }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voozaa-backup-${selectedYear}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const totalRevenue = devices.reduce((sum, d) => sum + months.reduce((mSum, m) => mSum + getDeviceRevenue(d, m, selectedYear), 0), 0);
  const currentMonthRevenue = devices.reduce((sum, d) => sum + getDeviceRevenue(d, months[currentMonth], selectedYear), 0);
  const quarterRevenue = devices.reduce((sum, d) => sum + quarterMonths.reduce((qSum, m) => qSum + getDeviceRevenue(d, m, selectedYear), 0), 0);
  const activeDevices = devices.filter(d => months.some(m => getDeviceRevenue(d, m, selectedYear) > 0)).length;

  const addNewYear = () => {
    const maxYear = Math.max(...availableYears);
    const newYear = maxYear + 1;
    setAvailableYears([...availableYears, newYear]);
    setDevices(devices.map(d => {
      const newDevice = { ...d };
      if (!newDevice.revenue) newDevice.revenue = {};
      if (!newDevice.revenue[newYear]) {
        newDevice.revenue[newYear] = { jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0, jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0 };
      }
      return newDevice;
    }));
    setSelectedYear(newYear);
  };

  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState(null);

  const generateReport = (monthIndex) => {
    const monthKey = months[monthIndex];
    const monthName = monthNames[monthIndex];
    
    const monthRevenue = devices.reduce((sum, d) => sum + getDeviceRevenue(d, monthKey, selectedYear), 0);
    const provision = monthRevenue * 0.1;
    
    const prevMonthKey = monthIndex > 0 ? months[monthIndex - 1] : null;
    const prevMonthRevenue = prevMonthKey 
      ? devices.reduce((sum, d) => sum + getDeviceRevenue(d, prevMonthKey, selectedYear), 0) 
      : 0;
    const revenueChange = monthIndex > 0 ? monthRevenue - prevMonthRevenue : 0;
    const revenueChangePercent = monthIndex > 0 && prevMonthRevenue > 0 
      ? ((revenueChange / prevMonthRevenue) * 100).toFixed(1) : 0;
    
    const activeDevicesReport = devices.filter(d => getDeviceRevenue(d, monthKey, selectedYear) > 0);
    
    const newDevicesArr = devices.filter(d => {
      const isActiveNow = getDeviceRevenue(d, monthKey, selectedYear) > 0;
      if (!isActiveNow) return false;
      for (let i = 0; i < monthIndex; i++) {
        if (getDeviceRevenue(d, months[i], selectedYear) > 0) return false;
      }
      return true;
    });
    
    const sortedByRevenue = [...activeDevicesReport].sort((a, b) => getDeviceRevenue(b, monthKey, selectedYear) - getDeviceRevenue(a, monthKey, selectedYear));
    const top3Devices = sortedByRevenue.slice(0, 3);
    const flop3Devices = sortedByRevenue.slice(-3).reverse();

    setReportData({
      monthIndex, monthKey, monthName, monthRevenue, provision, revenueChange, revenueChangePercent,
      activeDevices: activeDevicesReport, newDevicesArr, top3Devices, flop3Devices, year: selectedYear
    });
    setShowReport(true);
    setShowReportModal(false);
  };

  const roiStats = useMemo(() => {
    const TARGET = 1500;
    const devicesWithROI = devices.map(d => {
      const yearRevenue = getDeviceYearRevenue(d, selectedYear);
      const roi = (yearRevenue / TARGET) * 100;
      return { ...d, yearRevenue, roi };
    });
    
    const paidOff = devicesWithROI.filter(d => d.yearRevenue >= TARGET).length;
    const notPaidOff = devicesWithROI.filter(d => d.yearRevenue < TARGET && d.yearRevenue > 0).length;
    const avgROI = devicesWithROI.length > 0 
      ? devicesWithROI.reduce((sum, d) => sum + d.roi, 0) / devicesWithROI.length 
      : 0;
    
    return { paidOff, notPaidOff, avgROI, devicesWithROI };
  }, [devices, selectedYear]);

  // Traffic light stats
  const trafficLightStats = useMemo(() => {
    const stats = { super: 0, gut: 0, ok: 0, schwach: 0, kritisch: 0 };
    devices.forEach(d => {
      const monthRevenue = getDeviceCurrentMonthRevenue(d);
      const category = getTrafficLightCategory(monthRevenue);
      stats[category]++;
    });
    return stats;
  }, [devices, selectedYear]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Year Selector Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-4 mb-4 text-white">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-3">
              <Calendar size={24} />
              <span className="font-semibold text-lg">Geschaeftsjahr:</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {availableYears.map(year => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    selectedYear === year
                      ? 'bg-white text-blue-600 shadow-lg'
                      : 'bg-white/20 hover:bg-white/30'
                  }`}
                >
                  {year}
                </button>
              ))}
              <button
                onClick={addNewYear}
                className="px-3 py-2 bg-green-500 hover:bg-green-600 rounded-lg font-semibold flex items-center gap-1"
                title="Neues Jahr hinzufuegen"
              >
                <Plus size={18} />
                {Math.max(...availableYears) + 1}
              </button>
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            VooZaa Tracking {selectedYear}
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            {saveStatus && <span className="text-sm text-green-600 font-medium">{saveStatus}</span>}
            <button onClick={() => setShowImportModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-all">
              <Download size={16} className="rotate-180" />
              Import
            </button>
            <button onClick={() => setShowReportModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm transition-all">
              <FileText size={16} />
              PDF
            </button>
            <button onClick={exportData} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-600 text-white rounded-lg hover:bg-slate-700 text-sm transition-all">
              <Download size={16} />
              Backup
            </button>
            <button onClick={() => setShowTrashModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm transition-all relative">
              <Trash2 size={16} />
              Papierkorb
              {deletedDevices.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {deletedDevices.length}
                </span>
              )}
            </button>
            {onLogout && (
              <button onClick={onLogout} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm transition-all">
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <button onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-blue-50'
            }`}>
            <BarChart3 size={16} />
            Dashboard
          </button>
          <button onClick={() => setActiveTab('roi')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'roi' ? 'bg-orange-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-orange-50'
            }`}>
            <TrendingUp size={16} />
            ROI Uebersicht
          </button>
          <button onClick={() => setActiveTab('database')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'database' ? 'bg-purple-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-purple-50'
            }`}>
            <Database size={16} />
            Datenbank
          </button>
          <button onClick={() => setActiveTab('employees')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'employees' ? 'bg-green-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-green-50'
            }`}>
            <Users size={16} />
            Mitarbeiter & Charts
          </button>
          <button onClick={() => setActiveTab('devices')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'devices' ? 'bg-teal-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-teal-50'
            }`}>
            <Plus size={16} />
            Geraete bearbeiten
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
                <div className="text-xs text-slate-500 uppercase tracking-wide">Jahresumsatz {selectedYear}</div>
                <div className="text-2xl font-bold text-slate-800">{totalRevenue.toFixed(0)} EUR</div>
                <div className="text-xs text-green-600 font-medium">Provision: {(totalRevenue * 0.1).toFixed(0)} EUR</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
                <div className="text-xs text-slate-500 uppercase tracking-wide">{monthNames[currentMonth]} {selectedYear}</div>
                <div className="text-2xl font-bold text-blue-600">{currentMonthRevenue.toFixed(0)} EUR</div>
                <div className="text-xs text-slate-500">Aktueller Monat</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
                <div className="text-xs text-slate-500 uppercase tracking-wide">Q{currentQuarterNumber} {selectedYear}</div>
                <div className="text-2xl font-bold text-purple-600">{quarterRevenue.toFixed(0)} EUR</div>
                <div className="text-xs text-slate-500">Quartal</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
                <div className="text-xs text-slate-500 uppercase tracking-wide">Aktive Geraete</div>
                <div className="text-2xl font-bold text-teal-600">{activeDevices}</div>
                <div className="text-xs text-slate-500">von {devices.length} gesamt</div>
              </div>
            </div>

            {/* ROI Summary Card */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200 mb-4">
              <h3 className="text-sm font-semibold mb-3 text-slate-700 flex items-center gap-2">
                ROI Uebersicht {selectedYear}
                <span className="text-xs font-normal text-gray-500">(Ziel: 1.500 EUR pro Geraet)</span>
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{roiStats.paidOff}</div>
                  <div className="text-xs text-green-700">Abgezahlt</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-500">{roiStats.notPaidOff}</div>
                  <div className="text-xs text-red-700">Noch offen</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{roiStats.avgROI.toFixed(0)}%</div>
                  <div className="text-xs text-blue-700">Durchschnitt ROI</div>
                </div>
              </div>
            </div>

            {/* Traffic Light Summary */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200 mb-4">
              <h3 className="text-sm font-semibold mb-3 text-slate-700">Ampel-Status {monthNames[currentMonth]} {selectedYear}</h3>
              <div className="grid grid-cols-5 gap-2">
                <div className="text-center p-2 bg-green-100 rounded-lg border border-green-300">
                  <div className="w-4 h-4 rounded-full mx-auto mb-1" style={{ backgroundColor: '#22c55e', boxShadow: '0 0 8px #22c55e' }}></div>
                  <div className="text-lg font-bold text-green-700">{trafficLightStats.super}</div>
                  <div className="text-xs text-green-600">Super (120+)</div>
                </div>
                <div className="text-center p-2 bg-green-50 rounded-lg border border-green-200">
                  <div className="w-4 h-4 rounded-full mx-auto mb-1" style={{ backgroundColor: '#4ade80' }}></div>
                  <div className="text-lg font-bold text-green-600">{trafficLightStats.gut}</div>
                  <div className="text-xs text-green-500">Gut (95-120)</div>
                </div>
                <div className="text-center p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="w-4 h-4 rounded-full mx-auto mb-1" style={{ backgroundColor: '#fbbf24' }}></div>
                  <div className="text-lg font-bold text-yellow-700">{trafficLightStats.ok}</div>
                  <div className="text-xs text-yellow-600">OK (60-95)</div>
                </div>
                <div className="text-center p-2 bg-red-50 rounded-lg border border-red-200">
                  <div className="w-4 h-4 rounded-full mx-auto mb-1" style={{ backgroundColor: '#f87171' }}></div>
                  <div className="text-lg font-bold text-red-500">{trafficLightStats.schwach}</div>
                  <div className="text-xs text-red-400">Schwach (30-60)</div>
                </div>
                <div className="text-center p-2 bg-red-100 rounded-lg border border-red-300">
                  <div className="w-4 h-4 rounded-full mx-auto mb-1" style={{ backgroundColor: '#dc2626' }}></div>
                  <div className="text-lg font-bold text-red-700">{trafficLightStats.kritisch}</div>
                  <div className="text-xs text-red-600">Kritisch (0-30)</div>
                </div>
              </div>
            </div>

            {/* Monatshistorie */}
            <div className="bg-white rounded-xl shadow-sm p-3 border border-slate-200">
              <h3 className="text-sm font-semibold mb-2 text-slate-700">Monatshistorie {selectedYear}</h3>
              <div className="grid grid-cols-6 gap-1.5">
                {months.map((m, idx) => {
                  const mRevenue = devices.reduce((sum, d) => sum + getDeviceRevenue(d, m, selectedYear), 0);
                  const prevMonthKey = idx > 0 ? months[idx - 1] : null;
                  const prevMRevenue = prevMonthKey 
                    ? devices.reduce((sum, d) => sum + getDeviceRevenue(d, prevMonthKey, selectedYear), 0) 
                    : 0;
                  const revChange = idx > 0 ? mRevenue - prevMRevenue : 0;
                  const revChangePercent = idx > 0 && prevMRevenue > 0 
                    ? ((revChange / prevMRevenue) * 100).toFixed(0)
                    : 0;
                  const activeDevicesMonth = devices.filter(d => getDeviceRevenue(d, m, selectedYear) > 0).length;
                  const isCurrentMonth = idx === currentMonth && selectedYear === realCurrentYear;
                  const isFutureMonth = selectedYear > realCurrentYear || (selectedYear === realCurrentYear && idx > currentMonth);
                  
                  return (
                    <div key={m} className={`rounded-lg p-2 text-xs ${
                      isCurrentMonth 
                        ? 'bg-blue-100 border-2 border-blue-400' 
                        : isFutureMonth
                          ? 'bg-gray-50 border border-gray-200 opacity-50'
                          : 'bg-slate-50 border border-slate-200'
                    }`}>
                      <div className={`font-bold text-center text-sm ${isCurrentMonth ? 'text-blue-700' : 'text-slate-600'}`}>
                        {monthNames[idx]}
                      </div>
                      <div className="text-center font-semibold text-slate-800 text-sm">{mRevenue.toFixed(0)} EUR</div>
                      {idx > 0 && (
                        <div className={`text-center text-xs ${parseFloat(revChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {parseFloat(revChange) >= 0 ? '+' : ''}{revChangePercent}%
                        </div>
                      )}
                      <div className="text-center text-slate-600 text-xs mt-1">{activeDevicesMonth} Geraete</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ROI Tab */}
        {activeTab === 'roi' && (
          <div className="bg-white rounded-xl shadow-sm p-4 border">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <TrendingUp size={20} className="text-orange-600" />
              ROI Uebersicht {selectedYear}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Ziel: 1.500 EUR pro Geraet = 100% ROI (abgezahlt). Bei 3.000 EUR = 200% ROI.
            </p>
            
            {/* ROI Summary */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">{roiStats.paidOff}</div>
                <div className="text-xs text-green-700">Abgezahlt (100%+)</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-red-500">{roiStats.notPaidOff}</div>
                <div className="text-xs text-red-700">Noch offen (&lt;100%)</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">{roiStats.avgROI.toFixed(0)}%</div>
                <div className="text-xs text-blue-700">Durchschnitt ROI</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-2xl font-bold text-purple-600">{devices.length}</div>
                <div className="text-xs text-purple-700">Geraete gesamt</div>
              </div>
            </div>

            {/* Device ROI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {roiStats.devicesWithROI.map(device => (
                <div key={device.id} className={`p-3 rounded-xl border-2 ${
                  device.yearRevenue >= 1500 
                    ? 'bg-green-50 border-green-300' 
                    : device.yearRevenue > 0 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="text-center mb-2">
                    <div className="font-semibold text-sm text-gray-800">{device.deviceNumber || 'Neu'}</div>
                    <div className="text-xs text-gray-500 truncate">{device.partnerName || '-'}</div>
                  </div>
                  <ROICircle revenue={device.yearRevenue} target={1500} size={90} />
                </div>
              ))}
            </div>

            {devices.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Keine Geraete vorhanden. Fuege Geraete hinzu um den ROI zu sehen.
              </div>
            )}
          </div>
        )}

        {/* Database Tab */}
        {activeTab === 'database' && (
          <div className="bg-white rounded-xl shadow-sm p-4 border">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Database size={20} className="text-purple-600" />
              Datenbank durchsuchen ({selectedYear})
            </h2>
            <div className="flex gap-3 mb-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Suche nach Partner, Geraetenummer, Mitarbeiter..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>
              <select value={searchType} onChange={(e) => setSearchType(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500">
                <option value="all">Alle Felder</option>
                <option value="partner">Nur Partner</option>
                <option value="device">Nur Geraetenummer</option>
                <option value="owner">Nur Mitarbeiter</option>
              </select>
              <select value={trafficLightFilter} onChange={(e) => setTrafficLightFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500">
                <option value="all">Alle Status</option>
                <option value="super">Super (120+ EUR)</option>
                <option value="gut">Gut (95-120 EUR)</option>
                <option value="ok">OK (60-95 EUR)</option>
                <option value="schwach">Schwach (30-60 EUR)</option>
                <option value="kritisch">Kritisch (0-30 EUR)</option>
              </select>
            </div>
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-purple-100 border-b-2 border-purple-200">
                  <tr>
                    <th className="p-3 text-left font-semibold">Geraetenr.</th>
                    <th className="p-3 text-left font-semibold">Typ</th>
                    <th className="p-3 text-left font-semibold">Partner</th>
                    <th className="p-3 text-left font-semibold">Owner</th>
                    <th className="p-3 text-center font-semibold">{monthNames[currentMonth]} EUR</th>
                    <th className="p-3 text-center font-semibold">Status</th>
                    <th className="p-3 text-center font-semibold">ROI</th>
                    <th className="p-3 text-left font-semibold">Jahresumsatz</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedFilteredDevices.map((device, idx) => {
                    const yearRev = getDeviceYearRevenue(device, selectedYear);
                    const monthRev = getDeviceCurrentMonthRevenue(device);
                    return (
                      <tr key={device.id} className={idx % 2 === 0 ? 'bg-white hover:bg-purple-50' : 'bg-gray-50 hover:bg-purple-50'}>
                        <td className="p-3 font-medium text-purple-700">{device.deviceNumber || '-'}</td>
                        <td className="p-3">{device.deviceType || '-'}</td>
                        <td className="p-3 font-medium">{device.partnerName || '-'}</td>
                        <td className="p-3">{device.owner || '-'}</td>
                        <td className="p-3 text-center font-semibold">{monthRev.toFixed(0)} EUR</td>
                        <td className="p-3">
                          <TrafficLight revenue={monthRev} />
                        </td>
                        <td className="p-3">
                          <ROICircle revenue={yearRev} target={1500} size={60} />
                        </td>
                        <td className="p-3 font-semibold text-green-600">{yearRev.toFixed(2)} EUR</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Employees Tab */}
        {activeTab === 'employees' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm p-4 border">
              <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Users size={20} className="text-green-600" />
                  Mitarbeiter Dashboard {selectedYear}
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Monat:</span>
                  <select 
                    value={employeeViewMonth} 
                    onChange={(e) => setEmployeeViewMonth(parseInt(e.target.value))}
                    className="px-3 py-1.5 border rounded-lg text-sm font-medium bg-green-50 border-green-300"
                  >
                    {months.map((m, idx) => (
                      <option key={m} value={idx}>{monthNames[idx]} {selectedYear}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-green-100 border-b-2 border-green-200">
                    <tr>
                      <th className="p-3 text-left font-semibold">Mitarbeiter</th>
                      <th className="p-3 text-center font-semibold">Geraete</th>
                      <th className="p-3 text-center font-semibold">Std</th>
                      <th className="p-3 text-right font-semibold">{monthNames[employeeViewMonth]}</th>
                      <th className="p-3 text-right font-semibold">Q{Math.floor(employeeViewMonth / 3) + 1}</th>
                      <th className="p-3 text-right font-semibold">Jahr</th>
                      <th className="p-3 text-right font-semibold">10%</th>
                      <th className="p-3 text-center font-semibold">Aktion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeStats.map((emp, idx) => {
                      const isFSEGO = idx === 0;
                      return (
                        <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${isFSEGO ? 'opacity-70' : ''} hover:bg-green-50`}>
                          <td className="p-3">
                            {editingEmployee === idx ? (
                              <div className="flex gap-2">
                                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                                  className="px-2 py-1 border rounded w-32" autoFocus />
                                <button onClick={saveEmployeeName} className="px-2 py-1 bg-green-500 text-white rounded text-xs">OK</button>
                                <button onClick={cancelEdit} className="px-2 py-1 bg-gray-300 rounded text-xs">X</button>
                              </div>
                            ) : (
                              <span className="font-medium" style={{ color: colors[idx] }}>
                                {emp.name}
                                {isFSEGO && <span className="ml-1 text-xs text-gray-400">(Firma)</span>}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center">{emp.deviceCount}</td>
                          <td className="p-3 text-center">{emp.avgHours}h</td>
                          <td className="p-3 text-right">{emp.monthRevenue} EUR</td>
                          <td className="p-3 text-right">{emp.quarterRevenue} EUR</td>
                          <td className="p-3 text-right font-semibold">{emp.yearRevenue} EUR</td>
                          <td className="p-3 text-right font-bold text-green-600">
                            {isFSEGO ? '-' : `${emp.monthlyPayout} EUR`}
                          </td>
                          <td className="p-3 text-center">
                            {editingEmployee !== idx && (
                              <button onClick={() => startEditEmployee(idx)}
                                className="px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs hover:bg-blue-200">
                                Edit
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gradient-to-r from-green-200 to-emerald-200 border-t-2 border-green-400">
                    <tr className="font-bold">
                      <td className="p-3">GESAMT</td>
                      <td className="p-3 text-center">{employeeStats.reduce((sum, e) => sum + e.deviceCount, 0)}</td>
                      <td className="p-3 text-center">-</td>
                      <td className="p-3 text-right">{employeeStats.reduce((sum, e) => sum + parseFloat(e.monthRevenue), 0).toFixed(2)} EUR</td>
                      <td className="p-3 text-right">{employeeStats.reduce((sum, e) => sum + parseFloat(e.quarterRevenue), 0).toFixed(2)} EUR</td>
                      <td className="p-3 text-right">{employeeStats.reduce((sum, e) => sum + parseFloat(e.yearRevenue), 0).toFixed(2)} EUR</td>
                      <td className="p-3 text-right text-emerald-700">{employeeStats.slice(1).reduce((sum, e) => sum + parseFloat(e.monthlyPayout), 0).toFixed(2)} EUR</td>
                      <td className="p-3 text-center">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                          20%: {(employeeStats.slice(1).reduce((sum, e) => sum + parseFloat(e.monthlyPayout), 0) * 2).toFixed(2)} EUR
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Monthly Chart */}
            {hasChartData && (
              <div className="bg-white rounded-xl shadow-sm p-4 border">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp size={20} className="text-orange-600" />
                  Monatsumsatz pro Mitarbeiter {selectedYear}
                </h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} EUR`, '']} />
                      <Legend />
                      {employees.map((emp, idx) => (
                        <Line key={emp} type="monotone" dataKey={emp} stroke={colors[idx]} strokeWidth={2} dot={{ r: 3 }} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Cumulative Chart */}
            {hasChartData && (
              <div className="bg-white rounded-xl shadow-sm p-4 border">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 size={20} className="text-blue-600" />
                  Kumulierter Jahresumsatz pro Mitarbeiter {selectedYear}
                </h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={cumulativeChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} EUR`, '']} />
                      <Legend />
                      {employees.map((emp, idx) => (
                        <Line key={emp} type="monotone" dataKey={emp} stroke={colors[idx]} strokeWidth={2} dot={{ r: 3 }} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Devices Tab */}
        {activeTab === 'devices' && (
          <div className="bg-white rounded-xl shadow-sm p-4 border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Plus size={20} className="text-teal-600" />
                Geraete bearbeiten ({selectedYear})
              </h2>
              <div className="flex gap-2">
                <button onClick={() => setShowAddressModal(true)} className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
                  <MapPin size={16} />
                  Adressen
                </button>
                <button onClick={addDevice} className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm">
                  <Plus size={16} />
                  Neues Geraet
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-teal-100 border-b-2 border-teal-200">
                  <tr>
                    <th className="p-2 text-left font-semibold">Nr.</th>
                    <th className="p-2 text-left font-semibold">Typ</th>
                    <th className="p-2 text-left font-semibold">Partner</th>
                    <th className="p-2 text-left font-semibold">Adresse</th>
                    <th className="p-2 text-left font-semibold">Owner</th>
                    <th className="p-2 text-left font-semibold">Std</th>
                    {months.map((m, idx) => (
                      <th key={m} className="p-1 text-center font-semibold text-xs">{monthNames[idx]}</th>
                    ))}
                    <th className="p-2 text-center font-semibold">Status</th>
                    <th className="p-2 text-center font-semibold">ROI</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((device, idx) => {
                    const yearTotal = getDeviceYearRevenue(device, selectedYear);
                    const monthRev = getDeviceCurrentMonthRevenue(device);
                    return (
                      <tr key={device.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="p-1">
                          <input type="text" value={device.deviceNumber || ''} 
                            onChange={(e) => updateDevice(device.id, 'deviceNumber', e.target.value)}
                            className="w-20 px-1 py-1 border rounded text-xs" placeholder="DEV..." />
                        </td>
                        <td className="p-1">
                          <select value={device.deviceType || ''} onChange={(e) => updateDevice(device.id, 'deviceType', e.target.value)}
                            className="w-16 px-1 py-1 border rounded text-xs">
                            <option value="">-</option>
                            {deviceTypes.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </td>
                        <td className="p-1">
                          <input type="text" value={device.partnerName || ''} 
                            onChange={(e) => updateDevice(device.id, 'partnerName', e.target.value)}
                            className="w-24 px-1 py-1 border rounded text-xs" placeholder="Partner" />
                        </td>
                        <td className="p-1">
                          <select value={device.address || ''} onChange={(e) => updateDevice(device.id, 'address', e.target.value)}
                            className="w-32 px-1 py-1 border rounded text-xs">
                            <option value="">Adresse waehlen...</option>
                            {addresses.map(a => (
                              <option key={a.id} value={getFullAddress(a)}>{a.name} - {a.street}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-1">
                          <select value={device.owner || ''} onChange={(e) => updateDevice(device.id, 'owner', e.target.value)}
                            className="w-24 px-1 py-1 border rounded text-xs">
                            <option value="">-</option>
                            {employees.map(e => <option key={e} value={e}>{e}</option>)}
                          </select>
                        </td>
                        <td className="p-1">
                          <input type="number" value={device.hours || 0} 
                            onChange={(e) => updateDevice(device.id, 'hours', e.target.value)}
                            className="w-12 px-1 py-1 border rounded text-xs text-center" />
                        </td>
                        {months.map(m => (
                          <td key={m} className="p-0.5">
                            <input type="number" value={getDeviceRevenue(device, m, selectedYear) || ''} 
                              onChange={(e) => updateDevice(device.id, m, e.target.value)}
                              className="w-14 px-1 py-1 border rounded text-xs text-right" placeholder="0" />
                          </td>
                        ))}
                        <td className="p-1">
                          <TrafficLight revenue={monthRev} />
                        </td>
                        <td className="p-1">
                          <ROICircle revenue={yearTotal} target={1500} size={50} />
                        </td>
                        <td className="p-1">
                          <button onClick={() => deleteDevice(device.id)}
                            className="p-1 text-red-500 hover:bg-red-100 rounded">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
              <div className="p-4 border-b flex justify-between items-center bg-blue-50">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Download size={20} className="text-blue-600 rotate-180" />
                  Umsatz importieren ({selectedYear})
                </h2>
                <button onClick={() => { setShowImportModal(false); setImportText(''); }} className="text-gray-500 hover:text-gray-700 text-xl">X</button>
              </div>
              <div className="p-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Monat:</label>
                  <div className="flex gap-1 flex-wrap">
                    {months.map((m, idx) => (
                      <button key={m} onClick={() => setImportMonth(idx)}
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          importMonth === idx ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-blue-100'
                        }`}>
                        {monthNames[idx]}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea value={importText} onChange={(e) => setImportText(e.target.value)}
                  placeholder={`Standortname: Umsatz\n\nBeispiel:\nBar Restaurant: 478\nHotel Dips: 156`}
                  className="w-full h-40 p-3 border rounded-lg text-sm font-mono resize-none" />
                <div className="mt-4 flex gap-3">
                  <button onClick={() => setShowImportModal(false)} className="flex-1 px-4 py-2 bg-gray-200 rounded-lg">
                    Abbrechen
                  </button>
                  <button onClick={handleSimpleImport} disabled={!importText.trim()}
                    className={`flex-1 px-4 py-2 rounded-lg ${importText.trim() ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                    Importieren
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Report Modal */}
        {showReportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
              <h2 className="text-lg font-bold mb-4">Monatsbericht erstellen ({selectedYear})</h2>
              <div className="grid grid-cols-4 gap-2 mb-6">
                {months.map((m, idx) => (
                  <button key={m} onClick={() => generateReport(idx)}
                    className="px-3 py-2 bg-green-100 hover:bg-green-200 rounded-lg text-sm font-medium">
                    {monthNames[idx]}
                  </button>
                ))}
              </div>
              <button onClick={() => setShowReportModal(false)} className="w-full py-2 bg-gray-200 rounded-lg">
                Schliessen
              </button>
            </div>
          </div>
        )}

        {/* Report View */}
        {showReport && reportData && (
          <div className="fixed inset-0 bg-white z-50 overflow-auto">
            <div className="max-w-4xl mx-auto p-8">
              <div className="flex justify-between items-center mb-6 print:hidden">
                <h1 className="text-2xl font-bold">Monatsbericht {reportData.monthName} {reportData.year}</h1>
                <div className="flex gap-2">
                  <button onClick={() => window.print()} className="px-4 py-2 bg-green-600 text-white rounded-lg">
                    Drucken / PDF
                  </button>
                  <button onClick={() => setShowReport(false)} className="px-4 py-2 bg-gray-200 rounded-lg">
                    Schliessen
                  </button>
                </div>
              </div>
              <div className="border-2 border-gray-300 p-6 rounded-lg">
                <h2 className="text-xl font-bold text-center mb-4">VooZaa Monatsbericht</h2>
                <h3 className="text-lg text-center mb-6">{reportData.monthName} {reportData.year}</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Gesamtumsatz</div>
                    <div className="text-2xl font-bold">{reportData.monthRevenue.toFixed(2)} EUR</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Provision (10%)</div>
                    <div className="text-2xl font-bold">{reportData.provision.toFixed(2)} EUR</div>
                  </div>
                </div>
                <div className="mb-4">
                  <strong>Aktive Geraete:</strong> {reportData.activeDevices.length}
                </div>
                <div className="mb-4">
                  <strong>Neue Geraete:</strong> {reportData.newDevicesArr.length}
                </div>
                {reportData.top3Devices.length > 0 && (
                  <div className="mb-4">
                    <strong>Top 3 Geraete:</strong>
                    <ul className="list-disc list-inside mt-2">
                      {reportData.top3Devices.map((d, i) => (
                        <li key={i}>{d.deviceNumber} - {getDeviceRevenue(d, reportData.monthKey, reportData.year).toFixed(2)} EUR</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Address Modal */}
        {showAddressModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <MapPin size={20} className="text-purple-600" />
                  Adressen verwalten
                </h2>
                <button onClick={() => setShowAddressModal(false)} className="text-gray-500 hover:text-gray-700 text-xl">X</button>
              </div>
              <div className="p-4 bg-purple-50 border-b">
                <h3 className="font-semibold text-sm mb-3">Neue Adresse</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <input type="text" placeholder="Name" value={newAddress.name}
                    onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                    className="px-3 py-2 border rounded-lg text-sm" />
                  <input type="text" placeholder="Strasse" value={newAddress.street}
                    onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                    className="px-3 py-2 border rounded-lg text-sm" />
                  <input type="text" placeholder="PLZ" value={newAddress.zip}
                    onChange={(e) => setNewAddress({ ...newAddress, zip: e.target.value })}
                    className="px-3 py-2 border rounded-lg text-sm" />
                  <input type="text" placeholder="Stadt" value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="px-3 py-2 border rounded-lg text-sm" />
                </div>
                <button onClick={addAddress} className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm">
                  Hinzufuegen
                </button>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-sm mb-3">Vorhandene Adressen ({addresses.length})</h3>
                <div className="space-y-2">
                  {addresses.map(addr => {
                    const deviceCount = devices.filter(d => d.address === getFullAddress(addr)).length;
                    return (
                      <div key={addr.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{addr.name}</div>
                          <div className="text-sm text-gray-600">{getFullAddress(addr)}</div>
                          <div className="text-xs text-gray-400">{deviceCount} Geraet(e)</div>
                        </div>
                        <button onClick={() => deleteAddress(addr.id)} disabled={deviceCount > 0}
                          className={`p-2 rounded ${deviceCount > 0 ? 'text-gray-300' : 'text-red-500 hover:bg-red-100'}`}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trash Modal */}
        {showTrashModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-auto">
              <div className="p-4 border-b flex justify-between items-center bg-gray-100">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Trash2 size={20} className="text-gray-600" />
                  Papierkorb ({deletedDevices.length} Geraete)
                </h2>
                <div className="flex items-center gap-2">
                  {deletedDevices.length > 0 && (
                    <button onClick={emptyTrash} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 flex items-center gap-1">
                      <Trash2 size={14} />
                      Papierkorb leeren
                    </button>
                  )}
                  <button onClick={() => setShowTrashModal(false)} className="text-gray-500 hover:text-gray-700 text-xl px-2">X</button>
                </div>
              </div>
              
              {deletedDevices.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <Trash2 size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">Papierkorb ist leer</p>
                  <p className="text-sm">Geloeschte Geraete werden hier angezeigt</p>
                </div>
              ) : (
                <div className="p-4">
                  <div className="space-y-3">
                    {deletedDevices.map(device => {
                      const deletedDate = new Date(device.deletedAt);
                      const formattedDate = deletedDate.toLocaleDateString('de-DE', { 
                        day: '2-digit', month: '2-digit', year: 'numeric', 
                        hour: '2-digit', minute: '2-digit' 
                      });
                      const yearRevenue = months.reduce((sum, m) => {
                        if (device.revenue && device.revenue[selectedYear]) {
                          return sum + (parseFloat(device.revenue[selectedYear][m]) || 0);
                        }
                        return sum;
                      }, 0);
                      
                      return (
                        <div key={device.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-all">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className="bg-gray-200 rounded-lg p-2">
                                <Database size={20} className="text-gray-500" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-800">
                                  {device.deviceNumber || 'Ohne Nummer'}
                                  <span className="ml-2 text-sm font-normal text-gray-500">({device.deviceType || 'Kein Typ'})</span>
                                </div>
                                <div className="text-sm text-gray-600">{device.partnerName || 'Kein Partner'}</div>
                                <div className="text-xs text-gray-400">{device.address || 'Keine Adresse'}</div>
                              </div>
                            </div>
                            <div className="mt-2 flex items-center gap-4 text-xs">
                              <span className="text-gray-500">
                                Geloescht: {formattedDate}
                              </span>
                              <span className="text-gray-500">
                                Owner: {device.owner || '-'}
                              </span>
                              <span className="text-green-600 font-medium">
                                Umsatz {selectedYear}: {yearRevenue.toFixed(0)} EUR
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button 
                              onClick={() => restoreDevice(device.id)}
                              className="flex items-center gap-1.5 px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-all"
                            >
                              <RotateCcw size={14} />
                              Wiederherstellen
                            </button>
                            <button 
                              onClick={() => permanentlyDeleteDevice(device.id)}
                              className="flex items-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-all"
                            >
                              <Trash2 size={14} />
                              Endgueltig loeschen
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default DeviceTracker;

