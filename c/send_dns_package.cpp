#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include <sys/types.h>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <netinet/in.h>

#define BUF_SIZE 1024
#define SRV_PORT 53
const char _dns_server_ip[] = "127.0.0.1";
const char _domain[] = "hongkong.com";
typedef struct DnsHeader
{
	//1:会话标识标识 16bit 2字节
	unsigned short id;

	/**
	* 2:其他会话标识
	* |0 0000 0 0 0|0 000 0000|
	*/
	unsigned short tags;

	//3:问题数目
	unsigned short question_count; 

	//4:应答数目
	unsigned short answer_count; 

	//5:授权数目
	unsigned short ns_count; 

	//6:附加数目
	unsigned short addition_count; 
}DnsHeader;

/**
* 创建连接socket
*/
int createSocket(sockaddr_in* serveraddr){
	int client_fd;
	client_fd = socket(AF_INET, SOCK_DGRAM, 0); //创建socket
	printf("clientfd : %d\n", client_fd);

	serveraddr->sin_family = AF_INET;
	serveraddr->sin_port = htons(SRV_PORT);
	serveraddr->sin_addr.s_addr = inet_addr(_dns_server_ip);

	return client_fd;
}

/**
* 定义DNS请求头
*/
void createDnsHeader(char* buf){
	DnsHeader *dns_header = (DnsHeader*)buf;
	dns_header->id = htons(1);
	//|0 0000 0 0 1|0 000 0000|
	dns_header->tags = htons(0x0100);
	dns_header->question_count = htons(0x1);
}

/**
* 定义请求体
*/
void buildDnsQuestion(char* buf){
	char *content; //报文主体部分
	strcpy(buf + sizeof(DnsHeader) + 1, _domain); //指针定位到头部后多一位，留给域名计数器

	content = buf + sizeof(DnsHeader) + 1;
	int i = 0;

	/**
	* 计数器
	* 要把 www.baidu.com 变成：\3www\5baidu\3com\0
	*/
	while(content < (buf + sizeof(DnsHeader) + 1 + strlen(_domain))){
		if (*content == '.'){
			*(content - i - 1) = i;
			i = 0;
		} else {
			i ++ ;
		}
		content ++;
	}
	*(content - i - 1) = i;
}

/**
* 定义问题类型
*/
void buildDnsType(char* buf){
	unsigned short *query_type = (unsigned short*)(buf + sizeof(DnsHeader) + 1 + strlen(_domain) + 1);
	*query_type = htons(1);
	query_type ++;
	*query_type = htons(1);
}

/**
* 发送dns请求报文
*/
void sendDnsRequest(int client_fd, sockaddr_in* serveraddr, char* buf){
	int send_length = sendto(client_fd, buf, (sizeof(DnsHeader) + 2 + strlen(_domain) + 2+2), 0,
		(struct sockaddr*)serveraddr, sizeof(*serveraddr));
	int i = 0;
	for(;i<send_length;i++){
		printf("index:%d,", i);
		printf("c:%c,", (unsigned char)buf[i]);
		printf("d:%d,", (unsigned char)buf[i]);
		printf("\n");
	}

	printf("\nsend length : %d\n", send_length);
	perror("msg");
}

/**
* 接受dns响应报文
*/
void getDnsResponse(int client_fd, sockaddr_in* serveraddr){
	char *p;
	socklen_t res = (socklen_t)sizeof(struct sockaddr_in);
	char receive_buffer[BUF_SIZE];
	bzero(receive_buffer, BUF_SIZE);

	int recveive_length = recvfrom(client_fd, receive_buffer, BUF_SIZE, 0, (struct sockaddr *)serveraddr, &res);
	p = receive_buffer + recveive_length - 4;
	printf("receive length : %d\n", recveive_length);

	int i = 0;
	for(;i<recveive_length;i++){
		printf("index:%d,", i);
		printf("c:%c,", (unsigned char)receive_buffer[i]);
		printf("d:%d,", (unsigned char)receive_buffer[i]);
		printf("\n");
	}
	printf("\n%s ==> %u.%u.%u.%u\n", _domain, (unsigned char)*p, (unsigned char)*(p + 1), (unsigned char)*(p + 2), (unsigned char)*(p + 3));
}

int main(int argc, char** argv){
	char buf[BUF_SIZE];
	memset(buf, 0, BUF_SIZE);

	struct sockaddr_in serveraddr; //连接实例
	int client_fd = createSocket(&serveraddr);

	createDnsHeader(buf);
	buildDnsQuestion(buf);
	buildDnsType(buf);
	
	sendDnsRequest(client_fd, &serveraddr, buf);
	getDnsResponse(client_fd, &serveraddr);

	close(client_fd);

	return 0;
}