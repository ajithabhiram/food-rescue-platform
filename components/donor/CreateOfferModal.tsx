'use client'

import { useState } from 'react'
import { Upload, X } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import LocationPicker from '@/components/location/LocationPicker'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface CreateOfferModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateOfferModal({ isOpen, onClose, onSuccess }: CreateOfferModalProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    quantity_est: '',
    quantity_unit: 'kg',
    food_type: '',
    pickup_window_start: '',
    pickup_window_end: '',
    address: '',
    latitude: null as number | null,
    longitude: null as number | null,
  })

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0]
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let imagePath = null

      // Upload image if provided
      if (imageFile) {
        try {
          const fileExt = imageFile.name.split('.').pop()
          const fileName = `${user.id}/${Date.now()}.${fileExt}`
          
          const { error: uploadError } = await supabase.storage
            .from('offer-images')
            .upload(fileName, imageFile, {
              cacheControl: '3600',
              upsert: false
            })

          if (uploadError) {
            console.error('Image upload error:', uploadError)
            // Continue without image if upload fails
            toast.error('Image upload failed, continuing without image')
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('offer-images')
              .getPublicUrl(fileName)

            imagePath = publicUrl
          }
        } catch (error) {
          console.error('Image upload error:', error)
          toast.error('Image upload failed, continuing without image')
        }
      }

      // Create location point if coordinates provided
      let locationPoint = null
      if (formData.latitude && formData.longitude) {
        locationPoint = `POINT(${formData.longitude} ${formData.latitude})`
      }

      // Create offer
      const { error } = await supabase.from('offers').insert({
        donor_id: user.id,
        title: formData.title,
        description: formData.description,
        quantity_est: parseFloat(formData.quantity_est),
        quantity_unit: formData.quantity_unit,
        food_type: formData.food_type,
        pickup_window_start: formData.pickup_window_start,
        pickup_window_end: formData.pickup_window_end,
        address: formData.address,
        location: locationPoint,
        image_path: imagePath,
        status: 'available',
      })

      if (error) {
        console.error('Offer creation error:', error)
        if (error.code === '23503') {
          throw new Error('User profile not found. Please refresh the page and try again.')
        } else if (error.code === '42501') {
          throw new Error('Permission denied. Please make sure you are logged in as a donor.')
        }
        throw error
      }

      toast.success('Offer created successfully!')
      onSuccess()
      resetForm()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create offer')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      quantity_est: '',
      quantity_unit: 'kg',
      food_type: '',
      pickup_window_start: '',
      pickup_window_end: '',
      address: '',
      latitude: null,
      longitude: null,
    })
    setImageFile(null)
    setImagePreview(null)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Food Offer" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Food Photo
          </label>
          
          {imagePreview ? (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => {
                  setImageFile(null)
                  setImagePreview(null)
                }}
                className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 hover:border-primary-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600">
                {isDragActive
                  ? 'Drop the image here'
                  : 'Drag & drop an image, or click to select'}
              </p>
            </div>
          )}
        </div>

        {/* Title */}
        <Input
          label="Title"
          placeholder="e.g., Fresh Vegetables"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            rows={3}
            placeholder="Describe the food items..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        {/* Quantity and Type */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="number"
            label="Quantity"
            placeholder="10"
            value={formData.quantity_est}
            onChange={(e) => setFormData({ ...formData, quantity_est: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={formData.quantity_unit}
              onChange={(e) => setFormData({ ...formData, quantity_unit: e.target.value })}
            >
              <option value="kg">kg</option>
              <option value="lbs">lbs</option>
              <option value="units">units</option>
              <option value="servings">servings</option>
            </select>
          </div>
        </div>

        {/* Food Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Food Type
          </label>
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={formData.food_type}
            onChange={(e) => setFormData({ ...formData, food_type: e.target.value })}
            required
          >
            <option value="">Select type...</option>
            <option value="produce">Produce</option>
            <option value="prepared">Prepared Food</option>
            <option value="packaged">Packaged Goods</option>
            <option value="bakery">Bakery</option>
            <option value="dairy">Dairy</option>
            <option value="meat">Meat/Protein</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Pickup Window */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="datetime-local"
            label="Pickup Start"
            value={formData.pickup_window_start}
            onChange={(e) => setFormData({ ...formData, pickup_window_start: e.target.value })}
            required
          />

          <Input
            type="datetime-local"
            label="Pickup End"
            value={formData.pickup_window_end}
            onChange={(e) => setFormData({ ...formData, pickup_window_end: e.target.value })}
            required
          />
        </div>

        {/* Location Picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pickup Location *
          </label>
          <LocationPicker
            onLocationSelect={(location) => {
              setFormData({
                ...formData,
                address: location.address,
                latitude: location.lat,
                longitude: location.lng,
              })
            }}
            initialLocation={
              formData.latitude && formData.longitude
                ? { lat: formData.latitude, lng: formData.longitude }
                : undefined
            }
            initialAddress={formData.address}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            className="flex-1"
          >
            Create Offer
          </Button>
        </div>
      </form>
    </Modal>
  )
}
