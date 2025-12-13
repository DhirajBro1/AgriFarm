/**
 * ToolsScreen Component - Comprehensive farming tools and calculators
 *
 * Features:
 * - Yield Calculator: Calculate expected crop yields based on area and variety
 * - pH Tester: Check soil pH levels and get crop recommendations
 * - Unit Converter: Convert between metric and local Nepali farming units
 * - Expense Tracker: Track farming expenses by category and crop
 * - Notes: Personal farming notes and observations
 * - Data persistence using AsyncStorage for offline access
 * - Region-specific calculations and recommendations
 */

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import BottomNav from "../components/BottomNav";
import { ThemeColors, useTheme } from "../theme/ThemeProvider";
import CSVParser, { PHData } from "../utils/csvParser";
import { convertUnit, LOCAL_UNITS } from "../utils/farmingData";

type IoniconsName = keyof typeof Ionicons.glyphMap;
type ToolType = "yield" | "ph" | "units" | "expenses" | "notes";

// Interface for expense tracking
interface Expense {
  id: string;
  date: string;
  category: "seed" | "fertilizer" | "pesticide" | "tools" | "labor" | "other";
  description: string;
  amount: number;
  crop?: string;
}

interface Note {
  id: string;
  date: string;
  title: string;
  content: string;
  category: "observation" | "reminder" | "tip" | "problem";
}

export default function ToolsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [activeTool, setActiveTool] = useState<ToolType>("yield");
  const [csvParser] = useState(() => CSVParser.getInstance());
  const [phData, setPHData] = useState<PHData[]>([]);

  const [selectedCrop, setSelectedCrop] = useState("");
  const [landArea, setLandArea] = useState("");
  const [landUnit, setLandUnit] = useState("Ropani");
  const [estimatedYield, setEstimatedYield] = useState("");

  const [fromValue, setFromValue] = useState("");
  const [fromUnit, setFromUnit] = useState("Ropani");
  const [toUnit, setToUnit] = useState("Kattha");
  const [convertedValue, setConvertedValue] = useState("");

  const [phSearchQuery, setPHSearchQuery] = useState("");
  const [filteredPHData, setFilteredPHData] = useState<PHData[]>([]);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    category: "seed",
    date: new Date().toISOString().split("T")[0],
  });

  const [notes, setNotes] = useState<Note[]>([]);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [newNote, setNewNote] = useState<Partial<Note>>({
    category: "observation",
    date: new Date().toISOString().split("T")[0],
  });

  const initializeData = useCallback(async () => {
    try {
      await csvParser.initialize();
      setPHData(csvParser.getPHData());
      setFilteredPHData(csvParser.getPHData());
    } catch (error) {
      console.error("Error initializing tools data:", error);
    }
  }, [csvParser]);

  const loadStoredData = useCallback(async () => {
    try {
      const storedExpenses = await AsyncStorage.getItem("expenses");
      const storedNotes = await AsyncStorage.getItem("notes");

      if (storedExpenses) {
        setExpenses(JSON.parse(storedExpenses));
      }
      if (storedNotes) {
        setNotes(JSON.parse(storedNotes));
      }
    } catch (error) {
      console.error("Error loading stored data:", error);
    }
  }, []);

  useEffect(() => {
    initializeData();
    loadStoredData();
  }, [initializeData, loadStoredData]);

  useEffect(() => {
    if (phSearchQuery) {
      const filtered = phData.filter((item) =>
        item.vegetable.toLowerCase().includes(phSearchQuery.toLowerCase()),
      );
      setFilteredPHData(filtered);
    } else {
      setFilteredPHData(phData);
    }
  }, [phSearchQuery, phData]);

  useEffect(() => {
    if (fromValue && !isNaN(parseFloat(fromValue))) {
      const converted = convertUnit(parseFloat(fromValue), fromUnit, toUnit);
      setConvertedValue(converted.toFixed(4));
    } else {
      setConvertedValue("");
    }
  }, [fromValue, fromUnit, toUnit]);

  const calculateYield = () => {
    if (!selectedCrop || !landArea) {
      Alert.alert("Error", "Please select crop and enter land area");
      return;
    }

    const cropInfo = csvParser.getCropInfo(selectedCrop);
    if (!cropInfo) {
      setEstimatedYield("No yield data available for this crop");
      return;
    }

    const areaInRopani =
      landUnit === "Ropani"
        ? parseFloat(landArea)
        : convertUnit(parseFloat(landArea), landUnit, "Ropani");

    const yieldText = cropInfo.yield;
    if (yieldText === "Not Specified") {
      setEstimatedYield("Yield data not available");
      return;
    }

    const yieldMatch = yieldText.match(/(\d+)[-–](\d+)/);
    if (yieldMatch) {
      const minYield = parseInt(yieldMatch[1]);
      const maxYield = parseInt(yieldMatch[2]);
      const avgYield = (minYield + maxYield) / 2;

      const totalYield = avgYield * areaInRopani;
      setEstimatedYield(
        `${Math.round(totalYield)} kg (${Math.round((totalYield * minYield) / avgYield)}-${Math.round((totalYield * maxYield) / avgYield)} kg range)`,
      );
    } else {
      setEstimatedYield("Unable to parse yield data");
    }
  };

  const addExpense = async () => {
    if (!newExpense.description || !newExpense.amount) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    const expense: Expense = {
      id: Date.now().toString(),
      date: newExpense.date || new Date().toISOString().split("T")[0],
      category: newExpense.category || "other",
      description: newExpense.description,
      amount: newExpense.amount,
      crop: newExpense.crop,
    };

    const updatedExpenses = [expense, ...expenses];
    setExpenses(updatedExpenses);
    await AsyncStorage.setItem("expenses", JSON.stringify(updatedExpenses));

    setNewExpense({
      category: "seed",
      date: new Date().toISOString().split("T")[0],
    });
    setShowExpenseModal(false);
  };

  const addNote = async () => {
    if (!newNote.title || !newNote.content) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    const note: Note = {
      id: Date.now().toString(),
      date: newNote.date || new Date().toISOString().split("T")[0],
      title: newNote.title,
      content: newNote.content,
      category: newNote.category || "observation",
    };

    const updatedNotes = [note, ...notes];
    setNotes(updatedNotes);
    await AsyncStorage.setItem("notes", JSON.stringify(updatedNotes));

    setNewNote({
      category: "observation",
      date: new Date().toISOString().split("T")[0],
    });
    setShowNoteModal(false);
  };

  const deleteExpense = async (id: string) => {
    Alert.alert(
      "Delete Expense",
      "Are you sure you want to delete this expense?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const updatedExpenses = expenses.filter((exp) => exp.id !== id);
            setExpenses(updatedExpenses);
            await AsyncStorage.setItem(
              "expenses",
              JSON.stringify(updatedExpenses),
            );
          },
        },
      ],
    );
  };

  const deleteNote = async (id: string) => {
    Alert.alert("Delete Note", "Are you sure you want to delete this note?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const updatedNotes = notes.filter((note) => note.id !== id);
          setNotes(updatedNotes);
          await AsyncStorage.setItem("notes", JSON.stringify(updatedNotes));
        },
      },
    ]);
  };

  const renderYieldCalculator = () => (
    <ScrollView
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="calculator" size={20} color={colors.primary} />
          <Text style={styles.cardTitle}>Yield Estimation Tool</Text>
        </View>

        <Text style={styles.cardSubtitle}>
          Estimate your crop yield based on land area and crop type
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Select Crop</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.cropSelector}>
              {csvParser
                .getAllCrops()
                .slice(0, 8)
                .map((crop) => (
                  <TouchableOpacity
                    key={crop}
                    style={[
                      styles.cropChip,
                      selectedCrop === crop && styles.cropChipSelected,
                    ]}
                    onPress={() => setSelectedCrop(crop)}
                  >
                    <Text
                      style={[
                        styles.cropChipText,
                        selectedCrop === crop && styles.cropChipTextSelected,
                      ]}
                    >
                      {crop}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, { flex: 2 }]}>
            <Text style={styles.inputLabel}>Land Area</Text>
            <TextInput
              style={styles.textInput}
              value={landArea}
              onChangeText={setLandArea}
              placeholder="Enter area"
              keyboardType="numeric"
              placeholderTextColor={colors.muted}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
            <Text style={styles.inputLabel}>Unit</Text>
            <View style={styles.unitSelector}>
              {["Ropani", "Kattha", "Bigha"].map((unit) => (
                <TouchableOpacity
                  key={unit}
                  style={[
                    styles.unitButton,
                    landUnit === unit && styles.unitButtonSelected,
                  ]}
                  onPress={() => setLandUnit(unit)}
                >
                  <Text
                    style={[
                      styles.unitButtonText,
                      landUnit === unit && styles.unitButtonTextSelected,
                    ]}
                  >
                    {unit}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.calculateButton}
          onPress={calculateYield}
        >
          <Ionicons name="calculator" size={18} color="#fff" />
          <Text style={styles.calculateButtonText}>Calculate Yield</Text>
        </TouchableOpacity>

        {estimatedYield && (
          <View style={styles.resultContainer}>
            <View style={styles.resultHeader}>
              <Ionicons name="trending-up" size={18} color={colors.primary} />
              <Text style={styles.resultTitle}>Estimated Yield</Text>
            </View>
            <Text style={styles.resultText}>{estimatedYield}</Text>
          </View>
        )}
      </View>
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );

  const renderUnitConverter = () => (
    <ScrollView
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="swap-horizontal" size={20} color={colors.primary} />
          <Text style={styles.cardTitle}>Unit Converter</Text>
        </View>

        <Text style={styles.cardSubtitle}>
          Convert between local and metric units
        </Text>

        <View style={styles.converterContainer}>
          <View style={styles.converterRow}>
            <Text style={styles.inputLabel}>From</Text>
            <View style={styles.converterInput}>
              <TextInput
                style={styles.converterValueInput}
                value={fromValue}
                onChangeText={setFromValue}
                placeholder="Enter value"
                keyboardType="numeric"
                placeholderTextColor={colors.muted}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.converterUnitSelector}>
                  {["Ropani", "Kattha", "Bigha", "Mana", "Pathi"].map(
                    (unit) => (
                      <TouchableOpacity
                        key={unit}
                        style={[
                          styles.converterUnitButton,
                          fromUnit === unit &&
                            styles.converterUnitButtonSelected,
                        ]}
                        onPress={() => setFromUnit(unit)}
                      >
                        <Text
                          style={[
                            styles.converterUnitButtonText,
                            fromUnit === unit &&
                              styles.converterUnitButtonTextSelected,
                          ]}
                        >
                          {unit}
                        </Text>
                      </TouchableOpacity>
                    ),
                  )}
                </View>
              </ScrollView>
            </View>
          </View>

          <View style={styles.converterArrow}>
            <Ionicons name="arrow-down" size={20} color={colors.primary} />
          </View>

          <View style={styles.converterRow}>
            <Text style={styles.inputLabel}>To</Text>
            <View style={styles.converterInput}>
              <View style={styles.converterValueContainer}>
                <Text style={styles.convertedValueText}>
                  {convertedValue || "0.0000"}
                </Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.converterUnitSelector}>
                  {["Ropani", "Kattha", "Bigha", "Mana", "Pathi"].map(
                    (unit) => (
                      <TouchableOpacity
                        key={unit}
                        style={[
                          styles.converterUnitButton,
                          toUnit === unit && styles.converterUnitButtonSelected,
                        ]}
                        onPress={() => setToUnit(unit)}
                      >
                        <Text
                          style={[
                            styles.converterUnitButtonText,
                            toUnit === unit &&
                              styles.converterUnitButtonTextSelected,
                          ]}
                        >
                          {unit}
                        </Text>
                      </TouchableOpacity>
                    ),
                  )}
                </View>
              </ScrollView>
            </View>
          </View>
        </View>

        <View style={styles.unitReferenceContainer}>
          <Text style={styles.unitReferenceTitle}>Quick Reference</Text>
          <View style={styles.unitReferenceGrid}>
            {LOCAL_UNITS.slice(0, 6).map((unit) => (
              <View key={unit.name} style={styles.unitReferenceItem}>
                <Text style={styles.unitReferenceName}>{unit.name}</Text>
                <Text style={styles.unitReferenceValue}>
                  = {unit.toMetric} {unit.metricUnit}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );

  const renderPHGuide = () => (
    <ScrollView
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="flask" size={20} color={colors.primary} />
          <Text style={styles.cardTitle}>Soil pH Guide</Text>
        </View>

        <Text style={styles.cardSubtitle}>
          Find optimal pH range for your crops
        </Text>

        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={colors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search vegetables..."
              value={phSearchQuery}
              onChangeText={setPHSearchQuery}
              placeholderTextColor={colors.muted}
            />
            {phSearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setPHSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color={colors.muted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <FlatList
          data={filteredPHData}
          keyExtractor={(item) => item.vegetable}
          renderItem={({ item }) => (
            <View style={styles.phCard}>
              <View style={styles.phCardHeader}>
                <Ionicons name="leaf" size={16} color={colors.primary} />
                <Text style={styles.phVegetableName}>{item.vegetable}</Text>
              </View>
              <View style={styles.phInfo}>
                <Text style={styles.phRange}>pH: {item.optimalPHRange}</Text>
                <Text style={styles.phCategory}>{item.categoryPreference}</Text>
              </View>
            </View>
          )}
          scrollEnabled={false}
        />
      </View>
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );

  const renderExpenseTracker = () => (
    <ScrollView
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="wallet" size={20} color={colors.primary} />
          <Text style={styles.cardTitle}>Expense Tracker</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowExpenseModal(true)}
          >
            <Ionicons name="add" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.cardSubtitle}>
          Track your farming expenses (Offline)
        </Text>

        {expenses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={40} color={colors.muted} />
            <Text style={styles.emptyText}>No expenses recorded yet</Text>
            <TouchableOpacity
              style={styles.emptyActionButton}
              onPress={() => setShowExpenseModal(true)}
            >
              <Text style={styles.emptyActionText}>Add First Expense</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.expenseSummary}>
              <Text style={styles.totalExpenseLabel}>Total Expenses</Text>
              <Text style={styles.totalExpenseAmount}>
                Rs.{" "}
                {expenses
                  .reduce((sum, exp) => sum + exp.amount, 0)
                  .toLocaleString()}
              </Text>
            </View>

            <FlatList
              data={expenses}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.expenseCard}>
                  <View style={styles.expenseCardHeader}>
                    <View style={styles.expenseInfo}>
                      <Text style={styles.expenseDescription}>
                        {item.description}
                      </Text>
                      <Text style={styles.expenseDate}>{item.date}</Text>
                    </View>
                    <View style={styles.expenseActions}>
                      <Text style={styles.expenseAmount}>
                        Rs. {item.amount.toLocaleString()}
                      </Text>
                      <TouchableOpacity
                        onPress={() => deleteExpense(item.id)}
                        style={styles.deleteButton}
                      >
                        <Ionicons name="trash" size={14} color="#E74C3C" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.expenseMetadata}>
                    <View
                      style={[
                        styles.categoryBadge,
                        { backgroundColor: getCategoryColor(item.category) },
                      ]}
                    >
                      <Text style={styles.categoryBadgeText}>
                        {item.category}
                      </Text>
                    </View>
                    {item.crop && (
                      <Text style={styles.expenseCrop}>Crop: {item.crop}</Text>
                    )}
                  </View>
                </View>
              )}
              scrollEnabled={false}
            />
          </>
        )}
      </View>
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );

  const renderNotes = () => (
    <ScrollView
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="document-text" size={20} color={colors.primary} />
          <Text style={styles.cardTitle}>Farming Notes</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowNoteModal(true)}
          >
            <Ionicons name="add" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.cardSubtitle}>
          Record observations and reminders
        </Text>

        {notes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={40} color={colors.muted} />
            <Text style={styles.emptyText}>No notes yet</Text>
            <TouchableOpacity
              style={styles.emptyActionButton}
              onPress={() => setShowNoteModal(true)}
            >
              <Text style={styles.emptyActionText}>Add First Note</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={notes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.noteCard}>
                <View style={styles.noteCardHeader}>
                  <View style={styles.noteInfo}>
                    <Text style={styles.noteTitle}>{item.title}</Text>
                    <Text style={styles.noteDate}>{item.date}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => deleteNote(item.id)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash" size={14} color="#E74C3C" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.noteContent} numberOfLines={3}>
                  {item.content}
                </Text>
                <View
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: getNoteCategoryColor(item.category) },
                  ]}
                >
                  <Text style={styles.categoryBadgeText}>{item.category}</Text>
                </View>
              </View>
            )}
            scrollEnabled={false}
          />
        )}
      </View>
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      seed: "#27AE60",
      fertilizer: "#8B4513",
      pesticide: "#E74C3C",
      tools: "#3498DB",
      labor: "#9B59B6",
      other: "#95A5A6",
    };
    return colors[category] || colors.other;
  };

  const getNoteCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      observation: "#3498DB",
      reminder: "#F39C12",
      tip: "#27AE60",
      problem: "#E74C3C",
    };
    return colors[category] || colors.observation;
  };

  const tools: {
    key: ToolType;
    label: string;
    icon: IoniconsName;
  }[] = [
    { key: "yield" as ToolType, label: "Yield Calculator", icon: "calculator" },
    {
      key: "units" as ToolType,
      label: "Unit Converter",
      icon: "swap-horizontal",
    },
    { key: "ph" as ToolType, label: "pH Guide", icon: "flask" },
    { key: "expenses" as ToolType, label: "Expenses", icon: "wallet" },
    { key: "notes" as ToolType, label: "Notes", icon: "document-text" },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Ionicons name="construct" size={20} color="#fff" />
            <Text style={styles.headerTitle}>Farming Tools</Text>
          </View>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContainer}
        >
          {tools.map((tool) => (
            <TouchableOpacity
              key={tool.key}
              style={[
                styles.tabButton,
                activeTool === tool.key && styles.tabButtonActive,
              ]}
              onPress={() => setActiveTool(tool.key)}
            >
              <Ionicons
                name={tool.icon}
                size={16}
                color={activeTool === tool.key ? colors.primary : colors.muted}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTool === tool.key && styles.tabTextActive,
                ]}
              >
                {tool.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.content}>
        {activeTool === "yield" && renderYieldCalculator()}
        {activeTool === "units" && renderUnitConverter()}
        {activeTool === "ph" && renderPHGuide()}
        {activeTool === "expenses" && renderExpenseTracker()}
        {activeTool === "notes" && renderNotes()}
      </View>

      <Modal visible={showExpenseModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Expense</Text>
              <TouchableOpacity onPress={() => setShowExpenseModal(false)}>
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.categorySelector}>
                    {[
                      "seed",
                      "fertilizer",
                      "pesticide",
                      "tools",
                      "labor",
                      "other",
                    ].map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.categoryButton,
                          newExpense.category === cat &&
                            styles.categoryButtonSelected,
                        ]}
                        onPress={() =>
                          setNewExpense({
                            ...newExpense,
                            category: cat as Expense["category"],
                          })
                        }
                      >
                        <Text
                          style={[
                            styles.categoryButtonText,
                            newExpense.category === cat &&
                              styles.categoryButtonTextSelected,
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newExpense.description || ""}
                  onChangeText={(text) =>
                    setNewExpense({ ...newExpense, description: text })
                  }
                  placeholder="Enter description"
                  placeholderTextColor={colors.muted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount (Rs) *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newExpense.amount?.toString() || ""}
                  onChangeText={(text) =>
                    setNewExpense({
                      ...newExpense,
                      amount: parseFloat(text) || 0,
                    })
                  }
                  placeholder="Enter amount"
                  keyboardType="numeric"
                  placeholderTextColor={colors.muted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Crop (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={newExpense.crop || ""}
                  onChangeText={(text) =>
                    setNewExpense({ ...newExpense, crop: text })
                  }
                  placeholder="Enter crop name"
                  placeholderTextColor={colors.muted}
                />
              </View>

              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={addExpense}
              >
                <Text style={styles.modalSaveButtonText}>Save Expense</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showNoteModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Note</Text>
              <TouchableOpacity onPress={() => setShowNoteModal(false)}>
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.categorySelector}>
                    {["observation", "reminder", "tip", "problem"].map(
                      (cat) => (
                        <TouchableOpacity
                          key={cat}
                          style={[
                            styles.categoryButton,
                            newNote.category === cat &&
                              styles.categoryButtonSelected,
                          ]}
                          onPress={() =>
                            setNewNote({
                              ...newNote,
                              category: cat as Note["category"],
                            })
                          }
                        >
                          <Text
                            style={[
                              styles.categoryButtonText,
                              newNote.category === cat &&
                                styles.categoryButtonTextSelected,
                            ]}
                          >
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      ),
                    )}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Title *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newNote.title || ""}
                  onChangeText={(text) =>
                    setNewNote({ ...newNote, title: text })
                  }
                  placeholder="Enter note title"
                  placeholderTextColor={colors.muted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Content *</Text>
                <TextInput
                  style={[styles.textInput, styles.multilineInput]}
                  value={newNote.content || ""}
                  onChangeText={(text) =>
                    setNewNote({ ...newNote, content: text })
                  }
                  placeholder="Enter your observations or notes"
                  multiline
                  numberOfLines={4}
                  placeholderTextColor={colors.muted}
                />
              </View>

              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={addNote}
              >
                <Text style={styles.modalSaveButtonText}>Save Note</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <BottomNav active="tools" />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.primary,
      paddingTop: 44,
      paddingBottom: 8,
      paddingHorizontal: 16,
    },
    headerContent: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: "#fff",
      marginLeft: 6,
    },
    tabsContainer: {
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tabsScrollContainer: {
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    tabButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginRight: 8,
      borderRadius: 16,
      backgroundColor: colors.cardMuted,
    },
    tabButtonActive: {
      backgroundColor: colors.primaryMuted,
    },
    tabText: {
      fontSize: 12,
      fontWeight: "500",
      color: colors.muted,
      marginLeft: 4,
    },
    tabTextActive: {
      color: colors.primary,
      fontWeight: "600",
    },
    content: {
      flex: 1,
    },
    tabContent: {
      flex: 1,
      padding: 12,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 20,
    },
    bottomSpacing: {
      height: 100,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 10,
      padding: 14,
      marginBottom: 90,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginLeft: 6,
      flex: 1,
    },
    addButton: {
      backgroundColor: colors.primary,
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
    },
    cardSubtitle: {
      fontSize: 13,
      color: colors.muted,
      marginBottom: 14,
    },
    inputGroup: {
      marginBottom: 14,
    },
    inputLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 6,
    },
    textInput: {
      backgroundColor: colors.cardMuted,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      fontSize: 14,
      color: colors.text,
    },
    multilineInput: {
      minHeight: 80,
      textAlignVertical: "top",
    },
    cropSelector: {
      flexDirection: "row",
      gap: 6,
    },
    cropChip: {
      backgroundColor: colors.cardMuted,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cropChipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    cropChipText: {
      fontSize: 12,
      fontWeight: "500",
      color: colors.text,
    },
    cropChipTextSelected: {
      color: "#fff",
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "flex-end",
    },
    unitSelector: {
      flexDirection: "column",
      gap: 4,
    },
    unitButton: {
      backgroundColor: colors.cardMuted,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    unitButtonSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    unitButtonText: {
      fontSize: 11,
      fontWeight: "500",
      color: colors.text,
    },
    unitButtonTextSelected: {
      color: "#fff",
    },
    calculateButton: {
      backgroundColor: colors.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      borderRadius: 8,
      marginTop: 6,
    },
    calculateButtonText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "600",
      marginLeft: 6,
    },
    resultContainer: {
      backgroundColor: colors.primaryMuted,
      padding: 12,
      borderRadius: 8,
      marginTop: 12,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    resultHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 6,
    },
    resultTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginLeft: 6,
    },
    resultText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.primary,
    },
    converterContainer: {
      gap: 16,
    },
    converterRow: {
      gap: 8,
    },
    converterInput: {
      gap: 8,
    },
    converterValueInput: {
      backgroundColor: colors.cardMuted,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      fontSize: 14,
      color: colors.text,
    },
    converterValueContainer: {
      backgroundColor: colors.accent,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      alignItems: "center",
    },
    convertedValueText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.primary,
    },
    converterUnitSelector: {
      flexDirection: "row",
      gap: 6,
    },
    converterUnitButton: {
      backgroundColor: colors.cardMuted,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    converterUnitButtonSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    converterUnitButtonText: {
      fontSize: 11,
      fontWeight: "500",
      color: colors.text,
    },
    converterUnitButtonTextSelected: {
      color: "#fff",
    },
    converterArrow: {
      alignItems: "center",
      paddingVertical: 8,
    },
    unitReferenceContainer: {
      marginTop: 16,
      backgroundColor: colors.accent,
      borderRadius: 8,
      padding: 12,
    },
    unitReferenceTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
    },
    unitReferenceGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    unitReferenceItem: {
      backgroundColor: colors.card,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 6,
      minWidth: "45%",
    },
    unitReferenceName: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.text,
    },
    unitReferenceValue: {
      fontSize: 10,
      color: colors.muted,
      marginTop: 2,
    },
    searchContainer: {
      marginBottom: 12,
    },
    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.cardMuted,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      marginLeft: 6,
      marginRight: 6,
    },
    phCard: {
      backgroundColor: colors.cardMuted,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    phCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 6,
    },
    phVegetableName: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginLeft: 6,
    },
    phInfo: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    phRange: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.primary,
    },
    phCategory: {
      fontSize: 12,
      color: colors.muted,
      flex: 1,
      marginLeft: 8,
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 30,
    },
    emptyText: {
      fontSize: 14,
      color: colors.muted,
      marginTop: 8,
      textAlign: "center",
    },
    emptyActionButton: {
      backgroundColor: colors.primaryMuted,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 16,
      marginTop: 12,
    },
    emptyActionText: {
      fontSize: 13,
      color: colors.primary,
      fontWeight: "500",
    },
    expenseSummary: {
      backgroundColor: colors.primaryMuted,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      alignItems: "center",
    },
    totalExpenseLabel: {
      fontSize: 12,
      color: colors.muted,
    },
    totalExpenseAmount: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.primary,
      marginTop: 2,
    },
    expenseCard: {
      backgroundColor: colors.cardMuted,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    expenseCardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    expenseInfo: {
      flex: 1,
    },
    expenseDescription: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
    },
    expenseDate: {
      fontSize: 11,
      color: colors.muted,
      marginTop: 2,
    },
    expenseActions: {
      alignItems: "flex-end",
    },
    expenseAmount: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.primary,
    },
    deleteButton: {
      padding: 4,
      marginTop: 4,
    },
    expenseMetadata: {
      flexDirection: "row",
      alignItems: "center",
    },
    categoryBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      marginRight: 8,
    },
    categoryBadgeText: {
      fontSize: 10,
      fontWeight: "600",
      color: "#fff",
    },
    expenseCrop: {
      fontSize: 11,
      color: colors.muted,
    },
    noteCard: {
      backgroundColor: colors.cardMuted,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    noteCardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    noteInfo: {
      flex: 1,
    },
    noteTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
    },
    noteDate: {
      fontSize: 11,
      color: colors.muted,
      marginTop: 2,
    },
    noteContent: {
      fontSize: 13,
      color: colors.text,
      lineHeight: 18,
      marginBottom: 8,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContainer: {
      backgroundColor: colors.card,
      borderRadius: 12,
      margin: 20,
      maxHeight: "80%",
      width: "90%",
      overflow: "hidden",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    modalContent: {
      padding: 16,
    },
    categorySelector: {
      flexDirection: "row",
      gap: 6,
    },
    categoryButton: {
      backgroundColor: colors.cardMuted,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    categoryButtonSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    categoryButtonText: {
      fontSize: 12,
      fontWeight: "500",
      color: colors.text,
    },
    categoryButtonTextSelected: {
      color: "#fff",
    },
    modalSaveButton: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: "center",
      marginTop: 16,
    },
    modalSaveButtonText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "600",
    },
  });
