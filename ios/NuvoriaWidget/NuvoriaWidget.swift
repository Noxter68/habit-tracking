import WidgetKit
import SwiftUI

// MARK: - Data Models
struct WidgetHabit: Codable {
    let id: String
    let title: String
    let completed: Bool
    let streak: Int
}

struct WidgetData: Codable {
    let habits: [WidgetHabit]
    let totalXP: Int
    let userName: String
    let lastUpdated: String
}

// MARK: - Provider
struct Provider: TimelineProvider {
    let appGroup = "group.com.davidplanchon.nuvoria"
    
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), data: getSampleData())
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = SimpleEntry(date: Date(), data: loadWidgetData() ?? getSampleData())
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        let currentDate = Date()
        let data = loadWidgetData() ?? getSampleData()
        let entry = SimpleEntry(date: currentDate, data: data)
        
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: currentDate)!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
    
    private func loadWidgetData() -> WidgetData? {
        guard let userDefaults = UserDefaults(suiteName: appGroup),
              let jsonString = userDefaults.string(forKey: "widgetData"),
              let jsonData = jsonString.data(using: .utf8) else {
            return nil
        }
        
        return try? JSONDecoder().decode(WidgetData.self, from: jsonData)
    }
    
    private func getSampleData() -> WidgetData {
        return WidgetData(
            habits: [
                WidgetHabit(id: "1", title: "Méditation", completed: false, streak: 5),
                WidgetHabit(id: "2", title: "Exercice", completed: true, streak: 12),
                WidgetHabit(id: "3", title: "Lecture", completed: false, streak: 3)
            ],
            totalXP: 1250,
            userName: "User",
            lastUpdated: Date().ISO8601Format()
        )
    }
}

// MARK: - Entry
struct SimpleEntry: TimelineEntry {
    let date: Date
    let data: WidgetData
}

// MARK: - Widget View
struct NuvoriaWidgetEntryView : View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family
    
    var body: some View {
        ZStack {
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(red: 0.95, green: 0.97, blue: 0.99),
                    Color(red: 0.98, green: 0.96, blue: 0.94)
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            
            switch family {
            case .systemSmall:
                SmallWidgetView(data: entry.data)
            case .systemMedium:
                MediumWidgetView(data: entry.data)
            default:
                SmallWidgetView(data: entry.data)
            }
        }
    }
}

// MARK: - Small Widget (Streak seulement)
struct SmallWidgetView: View {
    let data: WidgetData
    
    // Calcul du meilleur streak
    var bestStreak: Int {
        data.habits.map { $0.streak }.max() ?? 0
    }
    
    var body: some View {
        VStack(spacing: 8) {
            // Header
            Text("Nuvoria")
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(Color(red: 0.4, green: 0.45, blue: 0.5))
            
            Spacer()
            
            // Flamme géante
            Image(systemName: "flame.fill")
                .font(.system(size: 48))
                .foregroundColor(Color(red: 0.95, green: 0.67, blue: 0.40))
            
            // Streak number
            Text("\(bestStreak)")
                .font(.system(size: 36, weight: .bold))
                .foregroundColor(Color(red: 0.3, green: 0.35, blue: 0.4))
            
            Text("jours")
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(Color(red: 0.5, green: 0.55, blue: 0.6))
            
            Spacer()
            
            // XP
            HStack(spacing: 4) {
                Image(systemName: "star.fill")
                    .font(.system(size: 10))
                    .foregroundColor(Color(red: 0.95, green: 0.77, blue: 0.40))
                Text("\(data.totalXP) XP")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(Color(red: 0.4, green: 0.45, blue: 0.5))
            }
        }
        .padding(16)
    }
}

// MARK: - Medium Widget (Toutes les habitudes)
struct MediumWidgetView: View {
    let data: WidgetData
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                Text("Aujourd'hui")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(Color(red: 0.3, green: 0.35, blue: 0.4))
                
                Spacer()
                
                HStack(spacing: 4) {
                    Image(systemName: "star.fill")
                        .font(.system(size: 12))
                        .foregroundColor(Color(red: 0.95, green: 0.77, blue: 0.40))
                    Text("\(data.totalXP)")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(Color(red: 0.4, green: 0.45, blue: 0.5))
                }
            }
            
            // Toutes les habitudes (max 5-6 selon l'espace)
            VStack(spacing: 8) {
                ForEach(data.habits, id: \.id) { habit in
                    HabitRow(habit: habit)
                }
            }
            
            Spacer()
        }
        .padding(16)
    }
}

// HabitRow reste identique (garde le code existant)

struct HabitRow: View {
    let habit: WidgetHabit
    
    var body: some View {
        HStack(spacing: 10) {
            ZStack {
                Circle()
                    .fill(habit.completed ?
                          Color(red: 0.52, green: 0.74, blue: 0.62) :
                          Color(red: 0.95, green: 0.95, blue: 0.95))
                    .frame(width: 22, height: 22)
                
                if habit.completed {
                    Image(systemName: "checkmark")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.white)
                }
            }
            
            Text(habit.title)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(habit.completed ?
                                Color(red: 0.6, green: 0.65, blue: 0.7) :
                                Color(red: 0.3, green: 0.35, blue: 0.4))
                .strikethrough(habit.completed, color: Color(red: 0.6, green: 0.65, blue: 0.7))
            
            Spacer()
            
            if habit.streak > 0 {
                HStack(spacing: 3) {
                    Image(systemName: "flame.fill")
                        .font(.system(size: 11))
                        .foregroundColor(Color(red: 0.95, green: 0.67, blue: 0.40))
                    Text("\(habit.streak)")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(Color(red: 0.5, green: 0.55, blue: 0.6))
                }
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Widget Configuration
@main
struct NuvoriaWidget: Widget {
    let kind: String = "NuvoriaWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            NuvoriaWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Nuvoria")
        .description("Vos habitudes du jour")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - Preview
struct NuvoriaWidget_Previews: PreviewProvider {
    static var previews: some View {
        NuvoriaWidgetEntryView(entry: SimpleEntry(
            date: Date(),
            data: WidgetData(
                habits: [
                    WidgetHabit(id: "1", title: "Méditation", completed: false, streak: 5),
                    WidgetHabit(id: "2", title: "Exercice", completed: true, streak: 12)
                ],
                totalXP: 1250,
                userName: "User",
                lastUpdated: Date().ISO8601Format()
            )
        ))
        .previewContext(WidgetPreviewContext(family: .systemSmall))
    }
}
