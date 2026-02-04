import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Download, Search, Database, Users, BarChart3, TrendingUp, FileText, MapPin, LogOut } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { storage } from '../lib/supabase';

const DeviceTracker = ({ onLogout }) => {
  const [devices, setDevices] = useState([]);
  const [employees, setEmployees] = useState([
    'FSEGO', 'Mitarbeiter 2', 'Mitarbeiter 3', 'Mitarbeiter 4', 'Mitarbeiter 5',
    'Mitarbeiter 6', 'Mitarbeiter 7', 'Mitarbeiter 8', 'Mitarbeiter 9', 'Mitarbeiter 10'
  ]);
  const [addresses, setAddresses] = useState([
    { id: 1, name: 'Hauptstandort', street: 'Musterstraße 1', zip: '21335', city: 'Lüneburg' },
    { id: 2, name: 'Filiale Nord', street: 'Beispielweg 5', zip: '21335', city: 'Lüneburg' },
    { id: 3, name: 'Filiale Süd', street: 'Hauptstraße 10', zip: '21337', city: 'Lüneburg' },
    { id: 4, name: 'Bahnhof', street: 'Bahnhofstraße 3', zip: '21339', city: 'Lüneburg' },
  ]);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editName, setEditName] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [showDatabase, setShowDatabase] = useState(false);
  const [showEmployees, setShowEmployees] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importMode, setImportMode] = useState('month'); // 'month' or 'week'
  const [newAddress, setNewAddress] = useState({ name: '', street: '', zip: '', city: 'Lüneburg' });

  const deviceTypes = ['12 slot', '24 slot', '28 slot'];
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'];

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const currentMonthName = monthNames[currentMonth];
  
  const [selectedReportMonth, setSelectedReportMonth] = useState(currentMonth);
  const [importMonth, setImportMonth] = useState(currentMonth);
  const [importWeek, setImportWeek] = useState(1);
  const [employeeViewMonth, setEmployeeViewMonth] = useState(currentMonth);
  
  const getCurrentQuarter = () => {
    const quarter = Math.floor(currentMonth / 3);
    const quarterStartMonth = quarter * 3;
    const quarterMonths = [];
    for (let i = 0; i < 3; i++) {
      quarterMonths.push(months[quarterStartMonth + i]);
    }
    return quarterMonths;
  };

  const getPreviousQuarter = () => {
    const quarter = Math.floor(currentMonth / 3);
    const prevQuarter = (quarter - 1 + 4) % 4;
    const quarterStartMonth = prevQuarter * 3;
    const prevQuarterMonths = [];
    for (let i = 0; i < 3; i++) {
      prevQuarterMonths.push(months[quarterStartMonth + i]);
    }
    return prevQuarterMonths;
  };

  const getQuarterName = (quarterMonths) => {
    return quarterMonths.map(m => monthNames[months.indexOf(m)]).join('-');
  };

  const quarterMonths = getCurrentQuarter();
  const prevQuarterMonths = getPreviousQuarter();
  const quarterNames = getQuarterName(quarterMonths);
  const currentQuarterNumber = Math.floor(currentMonth / 3) + 1;

  useEffect(() => {
    const loadData = async () => {
      try {
        const devicesData = await storage.get('devices');
        const employeesData = await storage.get('employees');
        const addressesData = await storage.get('addresses');
        
        if (devicesData && devicesData.value) {
          setDevices(JSON.parse(devicesData.value));
        } else {
          setDevices([
            {
              id: 1, deviceNumber: 'DEV001', deviceType: '12 slot', address: 'Musterstraße 1, 21335 Lüneburg',
              partnerName: 'Partner A', owner: 'Mitarbeiter 1', hours: 5,
              jan: 1000, feb: 1500, mar: 1200, apr: 1800, may: 1600, jun: 2000,
              jul: 1900, aug: 2100, sep: 1700, oct: 1800, nov: 2200, dec: 2400
            },
            {
              id: 2, deviceNumber: 'DEV002', deviceType: '24 slot', address: 'Beispielweg 5, 21335 Lüneburg',
              partnerName: 'Partner B', owner: 'Mitarbeiter 2', hours: 7,
              jan: 800, feb: 1200, mar: 1000, apr: 1400, may: 1300, jun: 1600,
              jul: 1500, aug: 1700, sep: 1400, oct: 1500, nov: 1800, dec: 2000
            },
            {
              id: 3, deviceNumber: 'DEV003', deviceType: '28 slot', address: 'Hauptstraße 10, 21337 Lüneburg',
              partnerName: 'Partner A', owner: 'Mitarbeiter 1', hours: 8,
              jan: 1200, feb: 1800, mar: 1500, apr: 2000, may: 1900, jun: 2200,
              jul: 2100, aug: 2400, sep: 2000, oct: 2100, nov: 2500, dec: 2800
            },
            {
              id: 4, deviceNumber: 'DEV004', deviceType: '12 slot', address: 'Bahnhofstraße 3, 21339 Lüneburg',
              partnerName: 'Partner C', owner: 'Mitarbeiter 3', hours: 4,
              jan: 600, feb: 900, mar: 750, apr: 1100, may: 950, jun: 1200,
              jul: 1100, aug: 1300, sep: 1050, oct: 1150, nov: 1400, dec: 1600
            }
          ]);
        }
        
        if (employeesData && employeesData.value) {
          const loadedEmployees = JSON.parse(employeesData.value);
          if (loadedEmployees.length === 10) {
            setEmployees(loadedEmployees);
          }
        }
        
        if (addressesData && addressesData.value) {
          setAddresses(JSON.parse(addressesData.value));
        }
      } catch (error) {
        console.log('Keine gespeicherten Daten, verwende Beispieldaten');
        setDevices([
          {
            id: 1, deviceNumber: 'DEV001', deviceType: '12 slot', address: 'Musterstraße 1, 21335 Lüneburg',
            partnerName: 'Partner A', owner: 'Mitarbeiter 1', hours: 5,
            jan: 1000, feb: 1500, mar: 1200, apr: 1800, may: 1600, jun: 2000,
            jul: 1900, aug: 2100, sep: 1700, oct: 1800, nov: 2200, dec: 2400
          },
          {
            id: 2, deviceNumber: 'DEV002', deviceType: '24 slot', address: 'Beispielweg 5, 21335 Lüneburg',
            partnerName: 'Partner B', owner: 'Mitarbeiter 2', hours: 7,
            jan: 800, feb: 1200, mar: 1000, apr: 1400, may: 1300, jun: 1600,
            jul: 1500, aug: 1700, sep: 1400, oct: 1500, nov: 1800, dec: 2000
          },
          {
            id: 3, deviceNumber: 'DEV003', deviceType: '28 slot', address: 'Hauptstraße 10, 21337 Lüneburg',
            partnerName: 'Partner A', owner: 'Mitarbeiter 1', hours: 8,
            jan: 1200, feb: 1800, mar: 1500, apr: 2000, may: 1900, jun: 2200,
            jul: 2100, aug: 2400, sep: 2000, oct: 2100, nov: 2500, dec: 2800
          },
          {
            id: 4, deviceNumber: 'DEV004', deviceType: '12 slot', address: 'Bahnhofstraße 3, 21339 Lüneburg',
            partnerName: 'Partner C', owner: 'Mitarbeiter 3', hours: 4,
            jan: 600, feb: 900, mar: 750, apr: 1100, may: 950, jun: 1200,
            jul: 1100, aug: 1300, sep: 1050, oct: 1150, nov: 1400, dec: 1600
          }
        ]);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const saveData = async () => {
      if (devices.length > 0) {
        try {
          await storage.set('devices', JSON.stringify(devices));
          await storage.set('employees', JSON.stringify(employees));
          await storage.set('addresses', JSON.stringify(addresses));
          setSaveStatus('✓ Gespeichert');
          setTimeout(() => setSaveStatus(''), 2000);
        } catch (error) {
          console.error('Speicherfehler:', error);
        }
      }
    };
    saveData();
  }, [devices, employees, addresses]);

  const addDevice = () => {
    setDevices([...devices, {
      id: Date.now(), deviceNumber: '', deviceType: '', address: '', partnerName: '', owner: '', hours: 0,
      jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0, jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0
    }]);
  };

  const deleteDevice = (id) => {
    setDevices(devices.filter(d => d.id !== id));
  };

  const addAddress = () => {
    if (newAddress.name && newAddress.street && newAddress.zip && newAddress.city) {
      setAddresses([...addresses, { 
        id: Date.now(), 
        ...newAddress
      }]);
      setNewAddress({ name: '', street: '', zip: '', city: 'Lüneburg' });
      setShowAddressModal(false);
    }
  };

  const deleteAddress = (id) => {
    setAddresses(addresses.filter(a => a.id !== id));
  };

  const getFullAddress = (addr) => `${addr.street}, ${addr.zip} ${addr.city}`;

  // Simple Import Function
  const handleSimpleImport = () => {
    if (!importText.trim()) return;
    
    const lines = importText.trim().split('\n');
    const monthKey = months[importMonth];
    let updatedDevices = [...devices];
    let importCount = 0;
    
    for (const line of lines) {
      // Parse format: "Standortname: 123" or "Standortname, 123" or "Standortname 123"
      const match = line.match(/^(.+?)[\s:,;]+(\d+(?:[.,]\d+)?)\s*$/);
      if (!match) continue;
      
      const searchName = match[1].trim().toLowerCase();
      const revenue = parseFloat(match[2].replace(',', '.'));
      
      if (isNaN(revenue)) continue;
      
      // Find matching device by address name or partner name
      let deviceIndex = -1;
      
      // Try matching with address names
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
        
        // Also check partner name
        if (device.partnerName && (
          device.partnerName.toLowerCase().includes(searchName) ||
          searchName.includes(device.partnerName.toLowerCase())
        )) {
          deviceIndex = i;
          break;
        }
      }
      
      if (deviceIndex >= 0) {
        // Add to existing value (accumulate)
        const currentValue = parseFloat(updatedDevices[deviceIndex][monthKey]) || 0;
        updatedDevices[deviceIndex] = {
          ...updatedDevices[deviceIndex],
          [monthKey]: currentValue + revenue
        };
        importCount++;
      }
    }
    
    if (importCount > 0) {
      setDevices(updatedDevices);
      setImportText('');
      setShowImportModal(false);
      setSaveStatus(`✓ ${importCount} Einträge importiert`);
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const updateDevice = (id, field, value) => {
    setDevices(devices.map(d => 
      d.id === id ? { ...d, [field]: field === 'hours' || months.includes(field) ? parseFloat(value) || 0 : value } : d
    ));
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
    // Berechne Quartal basierend auf ausgewähltem Monat
    const selectedQuarter = Math.floor(employeeViewMonth / 3);
    const selectedQuarterStartMonth = selectedQuarter * 3;
    const selectedQuarterMonths = [];
    for (let i = 0; i < 3; i++) {
      if (selectedQuarterStartMonth + i <= employeeViewMonth) {
        selectedQuarterMonths.push(months[selectedQuarterStartMonth + i]);
      }
    }
    
    // Jahresumsatz nur bis zum ausgewählten Monat
    const yearMonthsUntilSelected = months.slice(0, employeeViewMonth + 1);
    
    return employees.map(emp => {
      const empDevices = devices.filter(d => d.owner === emp);
      const deviceCount = empDevices.length;
      const avgHours = deviceCount > 0 ? empDevices.reduce((sum, d) => sum + d.hours, 0) / deviceCount : 0;
      const monthRevenue = empDevices.reduce((sum, d) => sum + (d[months[employeeViewMonth]] || 0), 0);
      const quarterRevenue = empDevices.reduce((sum, d) => sum + selectedQuarterMonths.reduce((qSum, m) => qSum + (d[m] || 0), 0), 0);
      const yearRevenue = empDevices.reduce((sum, d) => sum + yearMonthsUntilSelected.reduce((ySum, m) => ySum + (d[m] || 0), 0), 0);
      const monthlyPayout = monthRevenue * 0.1;

      return {
        name: emp, deviceCount, avgHours: avgHours.toFixed(1),
        monthRevenue: monthRevenue.toFixed(2), quarterRevenue: quarterRevenue.toFixed(2),
        yearRevenue: yearRevenue.toFixed(2), monthlyPayout: monthlyPayout.toFixed(2)
      };
    });
  }, [devices, employees, employeeViewMonth]);

  const chartData = useMemo(() => {
    const result = [];
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const monthKey = months[monthIndex];
      const dataPoint = { month: monthNames[monthIndex] };
      
      for (let empIndex = 0; empIndex < 10; empIndex++) {
        const empName = employees[empIndex];
        let monatsSumme = 0;
        let kumulativeSumme = 0;
        
        for (let devIndex = 0; devIndex < devices.length; devIndex++) {
          const device = devices[devIndex];
          if (device.owner === empName) {
            const monatswert = device[monthKey];
            if (monatswert && !isNaN(monatswert)) {
              monatsSumme = monatsSumme + Number(monatswert);
            }
            for (let i = 0; i <= monthIndex; i++) {
              const wert = device[months[i]];
              if (wert && !isNaN(wert)) {
                kumulativeSumme = kumulativeSumme + Number(wert);
              }
            }
          }
        }
        dataPoint[empName] = monatsSumme;
        dataPoint[empName + '_Kumulativ'] = kumulativeSumme;
      }
      result.push(dataPoint);
    }
    return result;
  }, [devices, employees]);

  const hasChartData = devices.some(d => d.owner && d.owner.trim() !== '');

  const dashboardStats = useMemo(() => {
    const totalDevices = devices.length;
    const monthTotal = devices.reduce((sum, d) => sum + (parseFloat(d[months[currentMonth]]) || 0), 0);
    const quarterTotal = devices.reduce((sum, d) => sum + quarterMonths.reduce((qSum, m) => qSum + (parseFloat(d[m]) || 0), 0), 0);
    const yearTotal = devices.reduce((sum, d) => sum + months.reduce((ySum, m) => ySum + (parseFloat(d[m]) || 0), 0), 0);
    
    const prevMonthIndex = (currentMonth - 1 + 12) % 12;
    const prevMonthTotal = devices.reduce((sum, d) => sum + (parseFloat(d[months[prevMonthIndex]]) || 0), 0);
    const monthChange = monthTotal - prevMonthTotal;
    const monthChangePercent = prevMonthTotal > 0 ? ((monthChange / prevMonthTotal) * 100) : 0;
    
    const prevQuarterTotal = devices.reduce((sum, d) => sum + prevQuarterMonths.reduce((qSum, m) => qSum + (parseFloat(d[m]) || 0), 0), 0);
    const quarterChange = quarterTotal - prevQuarterTotal;
    const quarterChangePercent = prevQuarterTotal > 0 ? ((quarterChange / prevQuarterTotal) * 100) : 0;
    
    const locationStats = {};
    devices.forEach(device => {
      const address = device.address || 'Keine Adresse';
      if (!locationStats[address]) locationStats[address] = 0;
      months.forEach(m => { locationStats[address] += parseFloat(device[m]) || 0; });
    });
    
    const sortedLocations = Object.entries(locationStats).map(([address, revenue]) => ({ address, revenue })).sort((a, b) => b.revenue - a.revenue);
    const topLocations = sortedLocations.slice(0, 3);
    const flopLocations = sortedLocations.slice(-3).reverse();
    
    const partnerStats = {};
    devices.forEach(device => {
      const partner = device.partnerName || 'Kein Partner';
      if (!partnerStats[partner]) partnerStats[partner] = 0;
      months.forEach(m => { partnerStats[partner] += parseFloat(device[m]) || 0; });
    });
    
    const sortedPartners = Object.entries(partnerStats).map(([partner, revenue]) => ({ partner, revenue })).sort((a, b) => b.revenue - a.revenue);
    const topPartners = sortedPartners.slice(0, 3);
    const flopPartners = sortedPartners.slice(-3).reverse();
    
    return {
      totalDevices, monthTotal: monthTotal.toFixed(2), quarterTotal: quarterTotal.toFixed(2), yearTotal: yearTotal.toFixed(2),
      monthChange: monthChange.toFixed(2), monthChangePercent: monthChangePercent.toFixed(1),
      quarterChange: quarterChange.toFixed(2), quarterChangePercent: quarterChangePercent.toFixed(1),
      topLocations, flopLocations, topPartners, flopPartners
    };
  }, [devices, currentMonth, quarterMonths, prevQuarterMonths]);

  const filteredDevices = useMemo(() => {
    if (!searchQuery.trim()) return devices;
    const query = searchQuery.toLowerCase().trim();
    return devices.filter(device => {
      switch (searchType) {
        case 'partner': return device.partnerName && device.partnerName.toLowerCase().includes(query);
        case 'device': return device.deviceNumber && device.deviceNumber.toLowerCase().includes(query);
        case 'owner': return device.owner && device.owner.toLowerCase().includes(query);
        case 'all':
        default: return (
          (device.partnerName && device.partnerName.toLowerCase().includes(query)) ||
          (device.deviceNumber && device.deviceNumber.toLowerCase().includes(query)) ||
          (device.owner && device.owner.toLowerCase().includes(query)) ||
          (device.address && device.address.toLowerCase().includes(query))
        );
      }
    });
  }, [devices, searchQuery, searchType]);

  const exportData = () => {
    const dataStr = JSON.stringify({ devices, employees }, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `voozaa-tracking-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const [showReport, setShowReport] = useState(false);
  const [reportMonth, setReportMonth] = useState(null);
  const [reportData, setReportData] = useState(null);

  const generateReport = (monthIndex) => {
    const monthKey = months[monthIndex];
    const monthName = monthNames[monthIndex];
    
    const monthRevenue = devices.reduce((sum, d) => sum + (parseFloat(d[monthKey]) || 0), 0);
    const provision = monthRevenue * 0.1;
    
    const prevMonthKey = monthIndex > 0 ? months[monthIndex - 1] : null;
    const prevMonthRevenue = prevMonthKey 
      ? devices.reduce((sum, d) => sum + (parseFloat(d[prevMonthKey]) || 0), 0) 
      : 0;
    const revenueChange = monthIndex > 0 ? monthRevenue - prevMonthRevenue : 0;
    const revenueChangePercent = monthIndex > 0 && prevMonthRevenue > 0 
      ? ((revenueChange / prevMonthRevenue) * 100).toFixed(1) : 0;
    
    const activeDevices = devices.filter(d => (parseFloat(d[monthKey]) || 0) > 0);
    
    const newDevicesArr = devices.filter(d => {
      const isActiveNow = (parseFloat(d[monthKey]) || 0) > 0;
      if (!isActiveNow) return false;
      for (let i = 0; i < monthIndex; i++) {
        if ((parseFloat(d[months[i]]) || 0) > 0) return false;
      }
      return true;
    });
    
    const devicesByRevenue = [...activeDevices].sort((a, b) => (parseFloat(b[monthKey]) || 0) - (parseFloat(a[monthKey]) || 0));
    const top3Devices = devicesByRevenue.slice(0, 3);
    const flop3Devices = devicesByRevenue.slice(-3).reverse();
    
    const empMonthStats = employees.map(emp => {
      const empDevices = devices.filter(d => d.owner === emp);
      const empRevenue = empDevices.reduce((sum, d) => sum + (parseFloat(d[monthKey]) || 0), 0);
      const empProvision = empRevenue * 0.1;
      return { name: emp, revenue: empRevenue, provision: empProvision, deviceCount: empDevices.filter(d => (parseFloat(d[monthKey]) || 0) > 0).length };
    }).filter(e => e.revenue > 0).sort((a, b) => b.revenue - a.revenue);
    
    setReportData({
      monthKey, monthName, monthRevenue, provision, revenueChange, revenueChangePercent,
      activeDevices, newDevicesArr, devicesByRevenue, top3Devices, flop3Devices, empMonthStats
    });
    setReportMonth(monthIndex);
    setShowReport(true);
    setShowReportModal(false);
  };

  return (
    <div className="p-4 max-w-full overflow-x-auto bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          VooZaa Tracking
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          {saveStatus && <span className="text-sm text-green-600 font-medium">{saveStatus}</span>}
          <button onClick={() => setShowImportModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-all">
            <Download size={16} className="rotate-180" />
            Umsatz importieren
          </button>
          <button onClick={() => setShowReportModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm transition-all">
            <FileText size={16} />
            PDF Bericht
          </button>
          <button onClick={exportData} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-600 text-white rounded-lg hover:bg-slate-700 text-sm transition-all">
            <Download size={16} />
            Backup
          </button>
          {onLogout && (
            <button onClick={onLogout} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm transition-all">
              <LogOut size={16} />
              Logout
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
          Geräte bearbeiten
        </button>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <>
          {/* KPI Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-blue-100">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Geräte gesamt</div>
              <div className="text-3xl font-bold text-blue-600 mt-1">{dashboardStats.totalDevices}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-green-100">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Monat ({currentMonthName})</div>
              <div className="text-2xl font-bold text-green-600 mt-1">€ {dashboardStats.monthTotal}</div>
              <div className={`text-xs flex items-center gap-0.5 mt-1 ${parseFloat(dashboardStats.monthChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <span>{parseFloat(dashboardStats.monthChange) >= 0 ? '↑' : '↓'} {dashboardStats.monthChangePercent}% vs Vormonat</span>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-purple-100">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Q{currentQuarterNumber} ({quarterNames})</div>
              <div className="text-2xl font-bold text-purple-600 mt-1">€ {dashboardStats.quarterTotal}</div>
              <div className={`text-xs flex items-center gap-0.5 mt-1 ${parseFloat(dashboardStats.quarterChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <span>{parseFloat(dashboardStats.quarterChange) >= 0 ? '↑' : '↓'} {dashboardStats.quarterChangePercent}% vs Vorquartal</span>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-orange-100">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Jahr {currentYear}</div>
              <div className="text-2xl font-bold text-orange-600 mt-1">€ {dashboardStats.yearTotal}</div>
            </div>
          </div>

          {/* Top/Flop Standorte & Partner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-green-100">
              <h3 className="text-sm font-semibold mb-3 text-green-700 flex items-center gap-2">🏆 Top 3 Standorte</h3>
              <div className="space-y-2">
                {dashboardStats.topLocations.map((loc, idx) => (
                  <div key={idx} className="flex justify-between items-center px-3 py-2 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 truncate flex-1">
                      <span className="font-bold text-green-700 w-5">{idx + 1}.</span>
                      <span className="truncate text-sm">{loc.address}</span>
                    </div>
                    <span className="font-semibold text-green-600 ml-2 whitespace-nowrap">€{loc.revenue.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-red-100">
              <h3 className="text-sm font-semibold mb-3 text-red-700 flex items-center gap-2">📉 Flop 3 Standorte</h3>
              <div className="space-y-2">
                {dashboardStats.flopLocations.map((loc, idx) => (
                  <div key={idx} className="flex justify-between items-center px-3 py-2 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2 truncate flex-1">
                      <span className="font-bold text-red-700 w-5">{idx + 1}.</span>
                      <span className="truncate text-sm">{loc.address}</span>
                    </div>
                    <span className="font-semibold text-red-600 ml-2 whitespace-nowrap">€{loc.revenue.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-blue-100">
              <h3 className="text-sm font-semibold mb-3 text-blue-700 flex items-center gap-2">🤝 Top 3 Partner</h3>
              <div className="space-y-2">
                {dashboardStats.topPartners.map((partner, idx) => (
                  <div key={idx} className="flex justify-between items-center px-3 py-2 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 truncate flex-1">
                      <span className="font-bold text-blue-700 w-5">{idx + 1}.</span>
                      <span className="truncate text-sm">{partner.partner}</span>
                    </div>
                    <span className="font-semibold text-blue-600 ml-2 whitespace-nowrap">€{partner.revenue.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-orange-100">
              <h3 className="text-sm font-semibold mb-3 text-orange-700 flex items-center gap-2">📊 Flop 3 Partner</h3>
              <div className="space-y-2">
                {dashboardStats.flopPartners.map((partner, idx) => (
                  <div key={idx} className="flex justify-between items-center px-3 py-2 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2 truncate flex-1">
                      <span className="font-bold text-orange-700 w-5">{idx + 1}.</span>
                      <span className="truncate text-sm">{partner.partner}</span>
                    </div>
                    <span className="font-semibold text-orange-600 ml-2 whitespace-nowrap">€{partner.revenue.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Monatshistorie */}
          <div className="bg-white rounded-xl shadow-sm p-3 border border-slate-200 mt-4">
            <h3 className="text-sm font-semibold mb-2 text-slate-700">📅 Monatshistorie {currentYear}</h3>
            <div className="grid grid-cols-6 gap-1.5">
              {months.map((m, idx) => {
                const monthRevenue = devices.reduce((sum, d) => sum + (parseFloat(d[m]) || 0), 0);
                const prevMonthKey = idx > 0 ? months[idx - 1] : null;
                const prevMonthRevenue = prevMonthKey 
                  ? devices.reduce((sum, d) => sum + (parseFloat(d[prevMonthKey]) || 0), 0) 
                  : 0;
                const revenueChange = idx > 0 ? monthRevenue - prevMonthRevenue : 0;
                const revenueChangePercent = idx > 0 && prevMonthRevenue > 0 
                  ? ((revenueChange / prevMonthRevenue) * 100).toFixed(0)
                  : 0;
                const activeDevicesThisMonth = devices.filter(d => (parseFloat(d[m]) || 0) > 0).length;
                const newDevices = devices.filter(d => {
                  const isActiveNow = (parseFloat(d[m]) || 0) > 0;
                  if (!isActiveNow) return false;
                  for (let i = 0; i < idx; i++) {
                    if ((parseFloat(d[months[i]]) || 0) > 0) return false;
                  }
                  return true;
                }).length;
                const isCurrentMonth = idx === currentMonth;
                const isFutureMonth = idx > currentMonth;
                
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
                    <div className="text-center font-semibold text-slate-800 text-sm">€{monthRevenue.toFixed(0)}</div>
                    {idx > 0 && (
                      <div className={`text-center text-xs ${parseFloat(revenueChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {parseFloat(revenueChange) >= 0 ? '↑' : '↓'}{Math.abs(revenueChangePercent)}%
                      </div>
                    )}
                    <div className="text-center text-slate-600 text-xs mt-1">{activeDevicesThisMonth} Geräte</div>
                    {newDevices > 0 && (
                      <div className="text-center text-green-600 font-semibold text-xs">+{newDevices} neu</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Database Tab */}
      {activeTab === 'database' && (
        <div className="bg-white rounded-xl shadow-sm p-4 border">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Database size={20} className="text-purple-600" />
            Datenbank durchsuchen
          </h2>
          <div className="flex gap-3 mb-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Suche nach Partner, Gerätenummer, Mitarbeiter oder Adresse..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
              </div>
            </div>
            <select value={searchType} onChange={(e) => setSearchType(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500">
              <option value="all">Alle Felder</option>
              <option value="partner">Nur Partner</option>
              <option value="device">Nur Gerätenummer</option>
              <option value="owner">Nur Mitarbeiter</option>
            </select>
            {searchQuery && (<button onClick={() => setSearchQuery('')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Zurücksetzen</button>)}
          </div>
          <div className="mb-3 text-sm text-gray-600">
            {searchQuery ? (<span className="font-medium">{filteredDevices.length} von {devices.length} Geräten gefunden</span>) :
            (<span>Alle {devices.length} Geräte werden angezeigt</span>)}
          </div>
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-purple-100 border-b-2 border-purple-200">
                <tr>
                  <th className="p-3 text-left font-semibold">Gerätenr.</th>
                  <th className="p-3 text-left font-semibold">Typ</th>
                  <th className="p-3 text-left font-semibold">Partner</th>
                  <th className="p-3 text-left font-semibold">Owner</th>
                  <th className="p-3 text-left font-semibold">Adresse</th>
                  <th className="p-3 text-left font-semibold">Jahresumsatz</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.length > 0 ? (
                  filteredDevices.map((device, idx) => {
                    const yearRevenue = months.reduce((sum, m) => sum + (parseFloat(device[m]) || 0), 0);
                    return (
                      <tr key={device.id} className={idx % 2 === 0 ? 'bg-white hover:bg-purple-50' : 'bg-gray-50 hover:bg-purple-50'}>
                        <td className="p-3 font-medium text-purple-700">{device.deviceNumber || '-'}</td>
                        <td className="p-3">{device.deviceType || '-'}</td>
                        <td className="p-3 font-medium">{device.partnerName || '-'}</td>
                        <td className="p-3">{device.owner || '-'}</td>
                        <td className="p-3 text-xs">{device.address || '-'}</td>
                        <td className="p-3 font-semibold text-green-600">€ {yearRevenue.toFixed(2)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan="6" className="p-8 text-center text-gray-500">
                    {searchQuery ? `Keine Geräte gefunden für "${searchQuery}"` : 'Keine Geräte vorhanden'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
          {searchQuery && filteredDevices.length > 0 && (
            <div className="mt-4 p-4 bg-purple-50 rounded-lg">
              <h3 className="text-sm font-semibold mb-2">Zusammenfassung der Suchergebnisse:</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><span className="text-gray-600">Geräte:</span><span className="ml-2 font-bold text-purple-700">{filteredDevices.length}</span></div>
                <div><span className="text-gray-600">Gesamt-Jahresumsatz:</span><span className="ml-2 font-bold text-green-600">
                  € {filteredDevices.reduce((sum, d) => sum + months.reduce((mSum, m) => mSum + (parseFloat(d[m]) || 0), 0), 0).toFixed(2)}</span></div>
                <div><span className="text-gray-600">Partner:</span><span className="ml-2 font-bold">
                  {new Set(filteredDevices.map(d => d.partnerName).filter(p => p)).size}</span></div>
                <div><span className="text-gray-600">Mitarbeiter:</span><span className="ml-2 font-bold">
                  {new Set(filteredDevices.map(d => d.owner).filter(o => o)).size}</span></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Employees Tab */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-4 border">
            <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users size={20} className="text-green-600" />
                Mitarbeiter Dashboard
              </h2>
              
              {/* Monat Auswahl */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Abrechnungsmonat:</span>
                <select 
                  value={employeeViewMonth} 
                  onChange={(e) => setEmployeeViewMonth(parseInt(e.target.value))}
                  className="px-3 py-1.5 border rounded-lg text-sm font-medium bg-green-50 border-green-300 focus:ring-2 focus:ring-green-500"
                >
                  {months.map((m, idx) => (
                    <option key={m} value={idx}>
                      {monthNames[idx]} {currentYear}
                    </option>
                  ))}
                </select>
                {employeeViewMonth !== currentMonth && (
                  <button 
                    onClick={() => setEmployeeViewMonth(currentMonth)}
                    className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                  >
                    Aktuell
                  </button>
                )}
              </div>
            </div>
            
            {/* Info über ausgewählten Zeitraum */}
            <div className="mb-3 p-2 bg-green-50 rounded-lg text-sm">
              <span className="text-green-800">
                📅 Zeige Daten für: <strong>{monthNames[employeeViewMonth]} {currentYear}</strong>
                {' | '}
                <span className="text-green-600">
                  Q{Math.floor(employeeViewMonth / 3) + 1} (Jan-{monthNames[employeeViewMonth]})
                </span>
                {' | '}
                <span className="text-green-600">
                  Jahr bis {monthNames[employeeViewMonth]}
                </span>
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-green-100 border-b-2 border-green-200">
                  <tr>
                    <th className="p-3 text-left font-semibold">Mitarbeiter</th>
                    <th className="p-3 text-center font-semibold">Geräte</th>
                    <th className="p-3 text-center font-semibold">Ø Stunden</th>
                    <th className="p-3 text-right font-semibold">{monthNames[employeeViewMonth]}</th>
                    <th className="p-3 text-right font-semibold">Q{Math.floor(employeeViewMonth / 3) + 1}</th>
                    <th className="p-3 text-right font-semibold">Jahr (bis {monthNames[employeeViewMonth]})</th>
                    <th className="p-3 text-right font-semibold">Provision 10%</th>
                    <th className="p-3 text-center font-semibold">Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeStats.map((emp, idx) => {
                    const isFSEGO = idx === 0; // Erster Mitarbeiter = FSEGO (keine Provision)
                    return (
                      <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${isFSEGO ? 'opacity-70' : ''} hover:bg-green-50`}>
                        <td className="p-3">
                          {editingEmployee === idx ? (
                            <div className="flex gap-2">
                              <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                                className="px-2 py-1 border rounded w-32" autoFocus />
                              <button onClick={saveEmployeeName} className="px-2 py-1 bg-green-500 text-white rounded text-xs">✓</button>
                              <button onClick={cancelEdit} className="px-2 py-1 bg-gray-300 rounded text-xs">✕</button>
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
                        <td className="p-3 text-right">€ {emp.monthRevenue}</td>
                        <td className="p-3 text-right">€ {emp.quarterRevenue}</td>
                        <td className="p-3 text-right font-semibold">€ {emp.yearRevenue}</td>
                        <td className="p-3 text-right font-bold text-green-600">
                          {isFSEGO ? <span className="text-gray-400">-</span> : `€ ${emp.monthlyPayout}`}
                        </td>
                        <td className="p-3 text-center">
                          {editingEmployee !== idx && (
                            <button onClick={() => startEditEmployee(idx)}
                              className="px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs hover:bg-blue-200">
                              Bearbeiten
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gradient-to-r from-green-200 to-emerald-200 border-t-2 border-green-400">
                  <tr className="font-bold">
                    <td className="p-3 text-left">GESAMT / Ø</td>
                    <td className="p-3 text-center text-green-800">
                      {employeeStats.reduce((sum, e) => sum + e.deviceCount, 0)}
                    </td>
                    <td className="p-3 text-center text-green-800">
                      {(() => {
                        const activeEmployees = employeeStats.filter(e => e.deviceCount > 0);
                        const totalAvgHours = activeEmployees.reduce((sum, e) => sum + parseFloat(e.avgHours), 0);
                        return activeEmployees.length > 0 ? (totalAvgHours / activeEmployees.length).toFixed(1) : '0.0';
                      })()}h
                    </td>
                    <td className="p-3 text-right text-green-800">
                      € {employeeStats.reduce((sum, e) => sum + parseFloat(e.monthRevenue), 0).toFixed(2)}
                    </td>
                    <td className="p-3 text-right text-green-800">
                      € {employeeStats.reduce((sum, e) => sum + parseFloat(e.quarterRevenue), 0).toFixed(2)}
                    </td>
                    <td className="p-3 text-right text-green-800">
                      € {employeeStats.reduce((sum, e) => sum + parseFloat(e.yearRevenue), 0).toFixed(2)}
                    </td>
                    <td className="p-3 text-right text-emerald-700">
                      {/* Provision 10% - nur Mitarbeiter 2-10 (ohne FSEGO/idx 0) */}
                      € {employeeStats.slice(1).reduce((sum, e) => sum + parseFloat(e.monthlyPayout), 0).toFixed(2)}
                    </td>
                    <td className="p-3 text-center">
                      {/* Provision 20% - nur in GESAMT Zeile */}
                      <span className="bg-blue-600 text-white px-2 py-1 rounded font-bold">
                        20%: € {(employeeStats.slice(1).reduce((sum, e) => sum + parseFloat(e.monthlyPayout), 0) * 2).toFixed(2)}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Charts Section - Now part of Employees Tab */}
          <div className="bg-white rounded-xl shadow-sm p-4 border">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-orange-600" />
              Umsatz-Charts
            </h2>
            {hasChartData ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-gray-700">Monatlicher Umsatz pro Mitarbeiter</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`€${value}`, '']} />
                        <Legend />
                        {employees.map((emp, idx) => (
                          <Line key={emp} type="monotone" dataKey={emp} stroke={colors[idx]} strokeWidth={2} dot={{ r: 3 }} />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-gray-700">Kumulativer Jahresumsatz pro Mitarbeiter</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`€${value}`, '']} />
                        <Legend />
                        {employees.map((emp, idx) => (
                          <Line key={emp + '_Kumulativ'} type="monotone" dataKey={emp + '_Kumulativ'} 
                            name={emp + ' (Kumulativ)'} stroke={colors[idx]} strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <TrendingUp size={48} className="mx-auto mb-3 opacity-30" />
                <p>Keine Chart-Daten verfügbar.</p>
                <p className="text-sm">Weisen Sie Geräten Mitarbeiter zu, um Charts zu sehen.</p>
              </div>
            )}
          </div>
        </div>
      )}



      {/* Devices Edit Tab */}
      {activeTab === 'devices' && (
        <div className="bg-white rounded-xl shadow-sm p-4 border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Plus size={20} className="text-teal-600" />
              Geräte verwalten
            </h2>
            <div className="flex gap-2">
              <button onClick={() => setShowAddressModal(true)} className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
                <MapPin size={16} />
                Adressen verwalten
              </button>
              <button onClick={addDevice} className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm">
                <Plus size={16} />
                Neues Gerät
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-teal-100 border-b-2 border-teal-200">
                <tr>
                  <th className="p-2 text-left font-semibold">Gerätenr.</th>
                  <th className="p-2 text-left font-semibold">Typ</th>
                  <th className="p-2 text-left font-semibold">Adresse</th>
                  <th className="p-2 text-left font-semibold">Partner</th>
                  <th className="p-2 text-left font-semibold">Owner</th>
                  <th className="p-2 text-center font-semibold">Std.</th>
                  {monthNames.map(m => (
                    <th key={m} className="p-2 text-center font-semibold w-16">{m}</th>
                  ))}
                  <th className="p-2 text-center font-semibold">Aktion</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((device, idx) => (
                  <tr key={device.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-1">
                      <input type="text" value={device.deviceNumber} onChange={(e) => updateDevice(device.id, 'deviceNumber', e.target.value)}
                        className="w-20 px-1 py-1 border rounded text-xs" placeholder="DEV..." />
                    </td>
                    <td className="p-1">
                      <select value={device.deviceType} onChange={(e) => updateDevice(device.id, 'deviceType', e.target.value)}
                        className="w-20 px-1 py-1 border rounded text-xs">
                        <option value="">-</option>
                        {deviceTypes.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </td>
                    <td className="p-1">
                      <select value={device.address} onChange={(e) => updateDevice(device.id, 'address', e.target.value)}
                        className="w-36 px-1 py-1 border rounded text-xs">
                        <option value="">Adresse wählen...</option>
                        {addresses.map(a => (
                          <option key={a.id} value={getFullAddress(a)}>{a.name} - {a.street}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-1">
                      <input type="text" value={device.partnerName} onChange={(e) => updateDevice(device.id, 'partnerName', e.target.value)}
                        className="w-24 px-1 py-1 border rounded text-xs" placeholder="Partner" />
                    </td>
                    <td className="p-1">
                      <select value={device.owner} onChange={(e) => updateDevice(device.id, 'owner', e.target.value)}
                        className="w-28 px-1 py-1 border rounded text-xs">
                        <option value="">-</option>
                        {employees.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </td>
                    <td className="p-1">
                      <input type="number" value={device.hours} onChange={(e) => updateDevice(device.id, 'hours', e.target.value)}
                        className="w-12 px-1 py-1 border rounded text-xs text-center" />
                    </td>
                    {months.map(m => (
                      <td key={m} className="p-1">
                        <input type="number" value={device[m]} onChange={(e) => updateDevice(device.id, m, e.target.value)}
                          className="w-14 px-1 py-1 border rounded text-xs text-right" />
                      </td>
                    ))}
                    <td className="p-1 text-center">
                      <button onClick={() => deleteDevice(device.id)}
                        className="p-1 text-red-500 hover:bg-red-100 rounded">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {devices.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>Keine Geräte vorhanden.</p>
              <button onClick={addDevice} className="mt-2 text-teal-600 underline">Erstes Gerät hinzufügen</button>
            </div>
          )}
        </div>
      )}

      {/* Simple Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="p-4 border-b flex justify-between items-center bg-blue-50">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Download size={20} className="text-blue-600 rotate-180" />
                Umsatzdaten importieren
              </h2>
              <button onClick={() => { setShowImportModal(false); setImportText(''); }} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
            </div>
            
            <div className="p-4">
              {/* Monat auswählen */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Zielmonat:</label>
                <div className="flex gap-1 flex-wrap">
                  {months.map((m, idx) => (
                    <button
                      key={m}
                      onClick={() => setImportMonth(idx)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                        importMonth === idx
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 hover:bg-blue-100 text-gray-700'
                      }`}
                    >
                      {monthNames[idx]}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Eingabefeld */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Umsätze eingeben (werden addiert!):
                </label>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder={`Standortname: Umsatz

Beispiele:
Bar Restaurant Dampfkessel: 478
SNOW SPACE SALZBURG: 42
Hotel Dips & Drops: 156

Oder:
Hauptstandort, 350
Filiale Nord, 220`}
                  className="w-full h-40 p-3 border rounded-lg text-sm font-mono resize-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* Info Box */}
              <div className="bg-green-50 rounded-lg p-3 mb-4 text-xs">
                <div className="font-semibold text-green-800 mb-1">💡 So funktioniert's:</div>
                <ul className="text-green-700 space-y-0.5 list-disc list-inside">
                  <li>Format: <code className="bg-green-100 px-1 rounded">Standortname: Umsatz</code></li>
                  <li>Umsätze werden zum bestehenden Monatswert <strong>addiert</strong></li>
                  <li>Perfekt für wöchentliche Imports!</li>
                  <li>Standortname muss mit Adresse oder Partner übereinstimmen</li>
                </ul>
              </div>
              
              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowImportModal(false); setImportText(''); }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSimpleImport}
                  disabled={!importText.trim()}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium ${
                    importText.trim() 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Importieren & Addieren
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Address Management Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <MapPin size={20} className="text-purple-600" />
                Adressdatenbank verwalten
              </h2>
              <button onClick={() => setShowAddressModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            
            {/* Add new address */}
            <div className="p-4 bg-purple-50 border-b">
              <h3 className="font-semibold text-sm mb-3">Neue Adresse hinzufügen</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="Name/Bezeichnung"
                  value={newAddress.name}
                  onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                  className="px-3 py-2 border rounded-lg text-sm"
                />
                <input
                  type="text"
                  placeholder="Straße + Nr."
                  value={newAddress.street}
                  onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                  className="px-3 py-2 border rounded-lg text-sm"
                />
                <input
                  type="text"
                  placeholder="PLZ"
                  value={newAddress.zip}
                  onChange={(e) => setNewAddress({ ...newAddress, zip: e.target.value })}
                  className="px-3 py-2 border rounded-lg text-sm"
                />
                <input
                  type="text"
                  placeholder="Stadt"
                  value={newAddress.city}
                  onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                  className="px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div className="mt-2">
                <button
                  onClick={addAddress}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm flex items-center gap-1"
                >
                  <Plus size={16} /> Hinzufügen
                </button>
              </div>
            </div>
            
            {/* Address List */}
            <div className="p-4">
              <h3 className="font-semibold text-sm mb-3">Gespeicherte Adressen ({addresses.length})</h3>
              <div className="space-y-2">
                {addresses.map(addr => {
                  const devicesAtAddress = devices.filter(d => d.address === getFullAddress(addr));
                  return (
                    <div key={addr.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{addr.name}</div>
                        <div className="text-sm text-gray-600">{addr.street}, {addr.zip} {addr.city}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        {devicesAtAddress.length > 0 && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                            {devicesAtAddress.length} Gerät(e)
                          </span>
                        )}
                        <button
                          onClick={() => deleteAddress(addr.id)}
                          disabled={devicesAtAddress.length > 0}
                          className={`p-2 rounded ${devicesAtAddress.length > 0 ? 'text-gray-300 cursor-not-allowed' : 'text-red-500 hover:bg-red-100'}`}
                          title={devicesAtAddress.length > 0 ? 'Adresse hat zugeordnete Geräte' : 'Löschen'}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {addresses.length === 0 && (
                  <p className="text-center text-gray-500 py-4">Keine Adressen vorhanden</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report View - Druckbare Ansicht */}
      {showReport && reportData && (
        <div className="fixed inset-0 bg-white z-50 overflow-auto">
          {/* Toolbar */}
          <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 text-white p-3 flex justify-between items-center shadow-lg">
            <span className="font-semibold">Bericht: {reportData.monthName} {currentYear}</span>
            <div className="flex items-center gap-3">
              <span className="text-xs bg-white/20 px-3 py-1 rounded">
                💡 Drücke <strong>Strg+P</strong> (oder Cmd+P auf Mac) → "Als PDF speichern"
              </span>
              <button
                onClick={() => { setShowReport(false); setReportData(null); }}
                className="px-4 py-2 bg-white text-green-700 rounded-lg hover:bg-gray-100 text-sm font-medium"
              >
                ✕ Schließen
              </button>
            </div>
          </div>
          
          {/* Bericht Inhalt */}
          <div className="max-w-3xl mx-auto p-8 print:p-4">
            <h1 className="text-2xl font-bold text-center text-blue-800 mb-1">VooZaa Monatsbericht</h1>
            <h2 className="text-lg text-center text-gray-600 mb-1">{reportData.monthName} {currentYear}</h2>
            <p className="text-xs text-center text-gray-400 mb-6">Erstellt am: {new Date().toLocaleDateString('de-DE')}</p>
            
            {/* KPIs */}
            <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 mb-4">
              <h3 className="font-bold text-blue-800 mb-3">Monats-KPIs</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><strong>Gesamtumsatz:</strong> {reportData.monthRevenue.toFixed(2)} EUR</div>
                <div><strong>Provision (10%):</strong> {reportData.provision.toFixed(2)} EUR</div>
                <div><strong>Aktive Geräte:</strong> {reportData.activeDevices.length}</div>
                <div><strong>Neue Geräte:</strong> {reportData.newDevicesArr.length}</div>
                <div className="col-span-2">
                  <strong>Veränderung Vormonat:</strong>{' '}
                  <span className={reportData.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {reportData.revenueChange >= 0 ? '+' : ''}{reportData.revenueChange.toFixed(2)} EUR ({reportData.revenueChange >= 0 ? '+' : ''}{reportData.revenueChangePercent}%)
                  </span>
                </div>
              </div>
            </div>
            
            {/* Neue Geräte */}
            {reportData.newDevicesArr.length > 0 && (
              <div className="bg-green-50 border border-green-300 rounded-lg p-4 mb-4">
                <h3 className="font-bold text-green-800 mb-2">Neue Geräte im {reportData.monthName} ({reportData.newDevicesArr.length})</h3>
                <ul className="text-sm space-y-1">
                  {reportData.newDevicesArr.map((d, i) => (
                    <li key={i}>
                      <strong>{d.deviceNumber || 'N/A'}</strong> | {d.partnerName || 'Kein Partner'} | {d.address || 'Keine Adresse'} | {(parseFloat(d[reportData.monthKey]) || 0).toFixed(2)} EUR
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Top 3 */}
            {reportData.top3Devices.length > 0 && (
              <div className="mb-4">
                <h3 className="font-bold text-gray-700 border-b-2 pb-1 mb-2">Top 3 Geräte</h3>
                <table className="w-full text-sm">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="p-2 text-left">#</th>
                      <th className="p-2 text-left">Gerät</th>
                      <th className="p-2 text-left">Partner</th>
                      <th className="p-2 text-right">Umsatz</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.top3Devices.map((d, i) => (
                      <tr key={i} className="border-b">
                        <td className="p-2">{i + 1}.</td>
                        <td className="p-2">{d.deviceNumber || 'N/A'}</td>
                        <td className="p-2">{d.partnerName || 'N/A'}</td>
                        <td className="p-2 text-right">{(parseFloat(d[reportData.monthKey]) || 0).toFixed(2)} EUR</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Flop 3 */}
            {reportData.flop3Devices.length > 0 && reportData.activeDevices.length > 3 && (
              <div className="mb-4">
                <h3 className="font-bold text-gray-700 border-b-2 pb-1 mb-2">Flop 3 Geräte</h3>
                <table className="w-full text-sm">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="p-2 text-left">#</th>
                      <th className="p-2 text-left">Gerät</th>
                      <th className="p-2 text-left">Partner</th>
                      <th className="p-2 text-right">Umsatz</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.flop3Devices.map((d, i) => (
                      <tr key={i} className="border-b">
                        <td className="p-2">{i + 1}.</td>
                        <td className="p-2">{d.deviceNumber || 'N/A'}</td>
                        <td className="p-2">{d.partnerName || 'N/A'}</td>
                        <td className="p-2 text-right">{(parseFloat(d[reportData.monthKey]) || 0).toFixed(2)} EUR</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Mitarbeiter */}
            {reportData.empMonthStats.length > 0 && (
              <div className="mb-4">
                <h3 className="font-bold text-gray-700 border-b-2 pb-1 mb-2">Mitarbeiter-Übersicht</h3>
                <table className="w-full text-sm">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="p-2 text-left">Mitarbeiter</th>
                      <th className="p-2 text-right">Geräte</th>
                      <th className="p-2 text-right">Umsatz</th>
                      <th className="p-2 text-right">Provision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.empMonthStats.map((e, i) => (
                      <tr key={i} className="border-b">
                        <td className="p-2">{e.name}</td>
                        <td className="p-2 text-right">{e.deviceCount}</td>
                        <td className="p-2 text-right">{e.revenue.toFixed(2)} EUR</td>
                        <td className="p-2 text-right">{e.provision.toFixed(2)} EUR</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-100 font-bold">
                      <td className="p-2">GESAMT</td>
                      <td className="p-2 text-right">{reportData.empMonthStats.reduce((s, e) => s + e.deviceCount, 0)}</td>
                      <td className="p-2 text-right">{reportData.empMonthStats.reduce((s, e) => s + e.revenue, 0).toFixed(2)} EUR</td>
                      <td className="p-2 text-right">{reportData.empMonthStats.reduce((s, e) => s + e.provision, 0).toFixed(2)} EUR</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Alle Geräte */}
            <div className="mb-4">
              <h3 className="font-bold text-gray-700 border-b-2 pb-1 mb-2">Alle aktiven Geräte ({reportData.activeDevices.length})</h3>
              <table className="w-full text-xs">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="p-1 text-left">Gerät</th>
                    <th className="p-1 text-left">Typ</th>
                    <th className="p-1 text-left">Partner</th>
                    <th className="p-1 text-left">Owner</th>
                    <th className="p-1 text-right">Umsatz</th>
                    <th className="p-1 text-right">Provision</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.devicesByRevenue.map((d, i) => {
                    const rev = parseFloat(d[reportData.monthKey]) || 0;
                    return (
                      <tr key={i} className="border-b">
                        <td className="p-1">{d.deviceNumber || '-'}</td>
                        <td className="p-1">{d.deviceType || '-'}</td>
                        <td className="p-1">{d.partnerName || '-'}</td>
                        <td className="p-1">{d.owner || '-'}</td>
                        <td className="p-1 text-right">{rev.toFixed(2)} EUR</td>
                        <td className="p-1 text-right">{(rev * 0.1).toFixed(2)} EUR</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="text-center text-gray-400 text-xs mt-8 pt-4 border-t">
              VooZaa Tracking - Monatsbericht {reportData.monthName} {currentYear}
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FileText size={20} className="text-green-600" />
              Monatsbericht erstellen
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Wähle den Monat für den PDF-Bericht:
            </p>
            <div className="grid grid-cols-4 gap-2 mb-6">
              {months.map((m, idx) => {
                const hasData = devices.some(d => (parseFloat(d[m]) || 0) > 0);
                return (
                  <button
                    key={m}
                    onClick={() => setSelectedReportMonth(idx)}
                    disabled={!hasData}
                    className={`p-2 rounded-lg text-sm font-medium transition-all ${
                      selectedReportMonth === idx
                        ? 'bg-green-600 text-white'
                        : hasData
                          ? 'bg-gray-100 hover:bg-green-100 text-gray-700'
                          : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    {monthNames[idx]}
                  </button>
                );
              })}
            </div>
            <div className="bg-green-50 rounded-lg p-3 mb-4 text-sm">
              <div className="font-semibold text-green-800 mb-1">Bericht enthält:</div>
              <ul className="text-green-700 text-xs space-y-0.5">
                <li>• Monats-KPIs (Umsatz, Provision, Veränderung)</li>
                <li>• Neue Geräte im Monat</li>
                <li>• Top & Flop Geräte</li>
                <li>• Mitarbeiter-Übersicht mit Provisionen</li>
                <li>• Liste aller aktiven Geräte</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowReportModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
              >
                Abbrechen
              </button>
              <button
                onClick={() => generateReport(selectedReportMonth)}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2"
              >
                <FileText size={16} />
                PDF erstellen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 text-xs text-gray-500 text-center">
        Aktuelles Datum: {today.toLocaleDateString('de-DE')} | Monat: {currentMonthName} {currentYear} | Quartal: Q{currentQuarterNumber} ({quarterNames}) | Auszahlung = 10% vom Monatsumsatz
      </div>
    </div>
  );
};

export default DeviceTracker;
