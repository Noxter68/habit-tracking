import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet, Image } from 'react-native';
import { X } from 'lucide-react-native';
import tw from 'twrnc';
import { UpdateModalTexts } from '../utils/updateContent';

interface UpdateItem {
  title: string;
  description: string;
}

interface UpdateModalProps {
  visible: boolean;
  onClose: () => void;
  version: string;
  updates: UpdateItem[];
  texts: UpdateModalTexts;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ visible, onClose, version, updates, texts }) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={tw`flex-1 bg-black/60 justify-center items-center px-6`}>
        <View style={[tw`bg-white rounded-3xl w-full max-w-md overflow-hidden`, styles.shadow]}>
          {/* Header */}
          <View style={tw`bg-slate-50 px-6 pt-8 pb-6 border-b border-slate-100`}>
            <TouchableOpacity onPress={onClose} style={[tw`absolute top-4 right-4 w-9 h-9 items-center justify-center rounded-full bg-white`, styles.closeShadow]} activeOpacity={0.7}>
              <X size={20} color="#64748b" strokeWidth={2} />
            </TouchableOpacity>

            <View style={tw`items-center`}>
              <View style={tw`w-16 h-16 rounded-2xl bg-white items-center justify-center mb-4`}>
                <Image source={require('../../assets/icon/icon_app.png')} style={tw`w-14 h-14`} resizeMode="contain" />
              </View>
              <Text style={tw`text-2xl font-bold text-slate-800 mb-2`}>{texts.title}</Text>
              <View style={tw`bg-indigo-50 px-4 py-1.5 rounded-full`}>
                <Text style={tw`text-sm font-semibold text-indigo-600`}>Version {version}</Text>
              </View>
            </View>
          </View>

          {/* Contenu scrollable */}
          <ScrollView style={tw`max-h-96 px-6 py-6`}>
            <Text style={tw`text-base font-semibold text-slate-700 mb-5`}>{texts.whatsNew}</Text>

            {updates.length > 0 ? (
              updates.map((update, index) => (
                <View key={index} style={tw`mb-6`}>
                  <View style={tw`flex-row items-start mb-2`}>
                    <View style={tw`w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 mr-3`} />
                    <Text style={tw`flex-1 text-base font-medium text-slate-800`}>{update.title}</Text>
                  </View>
                  <Text style={tw`text-sm text-slate-600 ml-5`}>{update.description}</Text>
                </View>
              ))
            ) : (
              <Text style={tw`text-sm text-slate-500 text-center py-4`}>No updates available</Text>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={tw`px-6 pb-6 pt-4`}>
            <TouchableOpacity onPress={onClose} style={[tw`bg-indigo-600 rounded-2xl py-4 items-center`, styles.buttonShadow]} activeOpacity={0.8}>
              <Text style={tw`text-white font-semibold text-base`}>{texts.getStarted}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  closeShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonShadow: {
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
});
