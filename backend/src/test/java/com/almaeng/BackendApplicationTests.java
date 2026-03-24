package com.almaeng;

import com.almaeng.domain.book.service.BookRankingBatchService;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.bean.override.mockito.MockitoBean;


class BackendApplicationTests extends IntegrationTestSupport{

	@MockitoBean
	private BookRankingBatchService bookRankingBatchService;

	@Test
	void contextLoads() {
	}

}
