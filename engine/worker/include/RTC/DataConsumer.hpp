#ifndef MS_RTC_DATA_CONSUMER_HPP
#define MS_RTC_DATA_CONSUMER_HPP

#include "common.hpp"
#include "Channel/Request.hpp"
#include "RTC/SctpDictionaries.hpp"
#include <json.hpp>
#include <string>

namespace RTC
{
	class DataConsumer
	{
	public:
		class Listener
		{
		public:
			virtual void OnDataConsumerSendMessage(
			  RTC::DataConsumer* dataConsumer, uint32_t ppid, const uint8_t* msg, size_t len) = 0;
			virtual void OnDataConsumerDataProducerClosed(RTC::DataConsumer* dataConsumer)    = 0;
		};

	public:
		enum class Type : uint8_t
		{
			SCTP = 0,
			DIRECT
		};

	public:
		DataConsumer(
		  const std::string& id,
		  const std::string& dataProducerId,
		  RTC::DataConsumer::Listener* listener,
		  json& data,
		  size_t maxMessageSize);
		virtual ~DataConsumer();

	public:
		void FillJson(json& jsonObject) const;
		void FillJsonStats(json& jsonArray) const;
		void HandleRequest(Channel::Request* request);
		Type GetType() const
		{
			return this->type;
		}
		const RTC::SctpStreamParameters& GetSctpStreamParameters() const
		{
			return this->sctpStreamParameters;
		}
		bool IsActive() const
		{
			// clang-format off
			return (
				this->transportConnected &&
				(this->type == DataConsumer::Type::DIRECT || this->sctpAssociationConnected) &&
				!this->dataProducerClosed
			);
			// clang-format on
		}
		void TransportConnected();
		void TransportDisconnected();
		void SctpAssociationConnected();
		void SctpAssociationClosed();
		void DataProducerClosed();
		void SendMessage(uint32_t ppid, const uint8_t* msg, size_t len);

	public:
		// Passed by argument.
		const std::string id;
		const std::string dataProducerId;

	private:
		// Passed by argument.
		RTC::DataConsumer::Listener* listener{ nullptr };
		size_t maxMessageSize{ 0u };
		// Others.
		Type type;
		std::string typeString;
		RTC::SctpStreamParameters sctpStreamParameters;
		std::string label;
		std::string protocol;
		bool transportConnected{ false };
		bool sctpAssociationConnected{ false };
		bool dataProducerClosed{ false };
		size_t messagesSent{ 0u };
		size_t bytesSent{ 0u };
	};
} // namespace RTC

#endif
